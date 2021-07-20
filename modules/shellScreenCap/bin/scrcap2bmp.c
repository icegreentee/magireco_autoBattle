/* scrcap2bmp - convert Android screencap raw data to Windows BMP
   Author: segfault
   https://space.bilibili.com/15209122
*/

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <inttypes.h>
#include <byteswap.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <fcntl.h>

int bmp = 0;
int flip = 0;
int swap = 0;
int test_length = 0;
int del = 0;
int http = 0;
int test_port = 0;
int timeout = 0;

int scr_width = 0;
int scr_height = 0;
int px_count = 0;
int px_size32 = 0;
int px_size24 = 0;
int line_size32 = 0;
int line_size24 = 0;

unsigned char *buf, *ptr, *ptr2, *tmp_buf;

typedef struct buf_chunk_struct {
    unsigned char *buf;
    struct buf_chunk_struct *next;
} buf_chunk_type;

buf_chunk_type *buf_chunk_head, *buf_chunk;

int scrdump_size = 0, scrdump_header_size = 0;
int total_size_to_write = 0;

const int bmp_header_size = 54;
int bmp_pixel_data_size;
int whole_image_file_size;

#define http_header_buf_len 256
unsigned char http_header_buf[http_header_buf_len];
int http_header_size = 0;

const int whole_image_file_size_offset = 2;
const int bmp_width_offset = 18;
const int bmp_height_offset = 22;
const int bmp_bit_depth_offset = 28;
const int bmp_pixel_data_size_offset = 34;

const unsigned char bmp_header_template[54] = {
    0x42, 0x4D, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x36, 0x00, 0x00, 0x00, 0x28, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00};

int move_distance = 0, move_length = 0;
unsigned char *move_src;

#define ARG_TYPE_SWITCH 11
#define ARG_TYPE_NUMBER 12

#define VALID_ARG                0
#define INVALID_ARG_MULTIPLE_TIME 1
#define INVALID_ARG_OUT_OF_RANGE  2
#define INVALID_ARG_UNKNOWN_ARG   3

int parse_result_invalid_arg = INVALID_ARG_UNKNOWN_ARG;
int parse_result_value = 0;

static inline void parse_arg(char *arg, char *test, int type, unsigned int max) {
    int i = 0, max_str_len = 0;
    unsigned char max_str[64];

    parse_result_invalid_arg = INVALID_ARG_UNKNOWN_ARG;
    parse_result_value = 0;

    switch(type) {
    case ARG_TYPE_SWITCH:
        if (strncmp(arg, test, 2) == 0 && arg[2] == 0) {
            parse_result_value = 1;
            parse_result_invalid_arg = VALID_ARG;
        }
        break;
    case ARG_TYPE_NUMBER:
        memset((char*)max_str, 0, 64);
        sprintf((char*)max_str, "%d", max);
        max_str_len = strlen((char*)max_str);
        if (strncmp(arg, test, 2) == 0) {
            parse_result_invalid_arg = VALID_ARG;
            parse_result_value = 0;
            for (int i=2; arg[i]!=0; i++) {
                if (arg[i] >= '0' && arg[i] <= '9') {
                    if (i >= 2 + max_str_len) {
                        parse_result_invalid_arg = INVALID_ARG_OUT_OF_RANGE;
                        break;
                    }
                    parse_result_value *= 10;
                    parse_result_value += arg[i] - '0';
                } else {
                    parse_result_invalid_arg = INVALID_ARG_UNKNOWN_ARG;
                    break;
                }
            }
            if (parse_result_invalid_arg != VALID_ARG) break;
            if (parse_result_value > max) parse_result_invalid_arg = INVALID_ARG_OUT_OF_RANGE;
        }
        break;
    default:
        parse_result_invalid_arg = INVALID_ARG_UNKNOWN_ARG;
    }
}

static inline int parse_args(int argc, char **argv) {
    int print_help = 0, invalid_arg = 0;
    int i=0;

    if (argc <= 1) {
        print_help = 1;
    } else {
        for (i=1; i<argc; i++) {
            parse_result_invalid_arg = INVALID_ARG_UNKNOWN_ARG;
            if (strncmp(argv[i], "-h", 2) == 0 || strncmp(argv[i], "--help", 6) == 0) {
                print_help = 1;
                break;
            }
            parse_arg(argv[i], "-a", ARG_TYPE_SWITCH, 0);
            if (parse_result_invalid_arg == VALID_ARG) {
                if (bmp != 0 || flip != 0 || swap != 0 || del != 0) {
                    parse_result_invalid_arg = INVALID_ARG_MULTIPLE_TIME;
                    break;
                }
                bmp = 1; flip = 2; swap = 1; del = 1;
                continue;
            }
            parse_arg(argv[i], "-b", ARG_TYPE_SWITCH, 0);
            if (parse_result_invalid_arg == VALID_ARG) {
                if (bmp != 0) {
                    parse_result_invalid_arg = INVALID_ARG_MULTIPLE_TIME;
                    break;
                }
                bmp = 1;
                continue;
            }
            parse_arg(argv[i], "-s", ARG_TYPE_SWITCH, 0);
            if (parse_result_invalid_arg == VALID_ARG) {
                if (swap != 0) {
                    invalid_arg = INVALID_ARG_MULTIPLE_TIME;
                    break;
                }
                swap = 1;
                continue;
            }
            parse_arg(argv[i], "-l", ARG_TYPE_SWITCH, 0);
            if (parse_result_invalid_arg == VALID_ARG) {
                if (test_length != 0) {
                    invalid_arg = INVALID_ARG_MULTIPLE_TIME;
                    break;
                }
                test_length = 1;
                continue;
            }

            parse_arg(argv[i], "-f", ARG_TYPE_NUMBER, 2);
            if (parse_result_invalid_arg == VALID_ARG) {
                if (flip != 0) {
                    invalid_arg = INVALID_ARG_MULTIPLE_TIME;
                    break;
                }
                flip = parse_result_value;
                continue;
            }
            if (parse_result_invalid_arg != INVALID_ARG_UNKNOWN_ARG) break;

            parse_arg(argv[i], "-d", ARG_TYPE_NUMBER, 4);
            if (parse_result_invalid_arg == VALID_ARG) {
                if (del != 0) {
                    invalid_arg = INVALID_ARG_MULTIPLE_TIME;
                    break;
                }
                del = parse_result_value;
                continue;
            }
            if (parse_result_invalid_arg != INVALID_ARG_UNKNOWN_ARG) break;

            parse_arg(argv[i], "-p", ARG_TYPE_NUMBER, 65535);
            if (parse_result_invalid_arg == VALID_ARG) {
                if (http != 0) {
                    invalid_arg = INVALID_ARG_MULTIPLE_TIME;
                    break;
                }
                http = parse_result_value;
                continue;
            }
            if (parse_result_invalid_arg != INVALID_ARG_UNKNOWN_ARG) break;

            parse_arg(argv[i], "-t", ARG_TYPE_NUMBER, 65535);
            if (parse_result_invalid_arg == VALID_ARG) {
                if (test_port != 0) {
                    invalid_arg = INVALID_ARG_MULTIPLE_TIME;
                    break;
                }
                test_port = parse_result_value;
                continue;
            }
            if (parse_result_invalid_arg != INVALID_ARG_UNKNOWN_ARG) break;

            parse_arg(argv[i], "-w", ARG_TYPE_NUMBER, 3600);
            if (parse_result_invalid_arg == VALID_ARG) {
                if (timeout != 0) {
                    invalid_arg = INVALID_ARG_MULTIPLE_TIME;
                    break;
                }
                timeout = parse_result_value;
                continue;
            }
            if (parse_result_invalid_arg != INVALID_ARG_UNKNOWN_ARG) break;

            if (parse_result_invalid_arg != VALID_ARG) break;
        }
    }

    if (print_help) {
        fprintf(stderr, "\nusage: pipe screencap stdout to this program, like:\n");
        fprintf(stderr, "    screencap | scrcap2bmp -a \n\n");
        fprintf(stderr, "options:\n\n");
        fprintf(stderr, "    -h, --help      print this help\n\n");
        fprintf(stderr, "    -a              same as \"-b -f2 -s -d1\"\n\n");
        fprintf(stderr, "    -b              replace header with BMP header\n\n");
        fprintf(stderr, "    -fORIENTATION   flip the image, ORIENTATIONs:\n");
        fprintf(stderr, "                    1: flip horizontally;\n");
        fprintf(stderr, "                    2: flip vertically;\n\n");
        fprintf(stderr, "    -s              swap color channels, eg. RGBA=>ABGR\n\n");
        fprintf(stderr, "    -dCHANNEL       delete the specified color channel (after swap),\n");
        fprintf(stderr, "                    according to byte sequence.\n");
        fprintf(stderr, "                    CHANNEL may be one of the following:\n");
        fprintf(stderr, "                        1, 2, 3, 4\n");
        fprintf(stderr, "                    eg. \"-d1\" means ABGR => BGR\n");
        fprintf(stderr, "                    NOTE: currently, only 4-channel input is accepted.\n\n");
        fprintf(stderr, "    -pPORT          set up a bogus HTTP server listening at PORT\n");
        fprintf(stderr, "                    output data will be sent through HTTP instead of stdout\n\n");
        fprintf(stderr, "    -tPORT          test whether local PORT is available and then exit\n\n");
        fprintf(stderr, "    -wTIMEOUT       wait for HTTP connection for at most TIMEOUT seconds\n\n");
        fprintf(stderr, "    -l (not number) report output length (in bytes) to stderr,\n");
        fprintf(stderr, "                    do not write any actual output data\n\n");
        return INVALID_ARG_UNKNOWN_ARG;
    }

    switch (parse_result_invalid_arg) {
    case VALID_ARG:
        break;
    case INVALID_ARG_MULTIPLE_TIME:
        fprintf(stderr, "Invalid argument: \"%.8s\" cannot be specified for multiple times.\n", argv[i]);
        return parse_result_invalid_arg;
    case INVALID_ARG_OUT_OF_RANGE:
        fprintf(stderr, "Invalid argument: \"%.8s\" number out of range.\n", argv[i]);
        return parse_result_invalid_arg;
    case INVALID_ARG_UNKNOWN_ARG:
    default:
        fprintf(stderr, "Invalid argument: \"%.8s\"\n", argv[i]);
        return parse_result_invalid_arg;
    }
    return parse_result_invalid_arg;
}

static void flip_pixels(unsigned char *group, int elements_per_group, int bytes_per_element) {
    int i, group_size_bytes, len, allocated;
    unsigned char *px1, *px2;

    if (elements_per_group <= 1) return;

    allocated = 0;
    if (tmp_buf == NULL) tmp_buf = malloc(bytes_per_element);
    if (tmp_buf == NULL) {
        fprintf(stderr, "Cannot allocate memory.\n");
        free(buf);
        exit(2);
        return;
    }
    allocated = 1;

    px1 = group;
    px2 = tmp_buf;
    memcpy(px2, px1, bytes_per_element);
    group_size_bytes = elements_per_group * bytes_per_element;
    px2 = group + group_size_bytes - bytes_per_element;
    memcpy(px1, px2, bytes_per_element);
    px1 += bytes_per_element;
    for (i=1; i<elements_per_group/2; i++) {
        memcpy(px2, px1, bytes_per_element);
        px2 -= bytes_per_element;
        memcpy(px1, px2, bytes_per_element);
        px1 += bytes_per_element;
    }
    if (elements_per_group % 2 == 1) {
        px1 += bytes_per_element;
        px2 += bytes_per_element;
        len = elements_per_group / 2 - 1;
    } else {
        px2 += bytes_per_element;
        len = elements_per_group / 2 - 1;
    }

    if (elements_per_group >= 4) memcpy(px1, px2, (elements_per_group/2-1)*bytes_per_element);

    memcpy(group + group_size_bytes - bytes_per_element, tmp_buf, bytes_per_element);

    if (allocated) {
        free(tmp_buf);
        tmp_buf = NULL;
        allocated = 0;
    }
}

void free_buf_chunks(buf_chunk_type *head) {
    buf_chunk_type *chunk, *last_chunk;
    chunk = head;
    while (chunk != NULL) {
        if (chunk->buf != NULL) free(chunk->buf);
        chunk->buf = NULL;

        last_chunk = chunk;
        chunk = chunk->next;
        last_chunk->next = NULL;
        free(last_chunk);
    }
}

int http_header_add_str(char *line) {
    int line_len;
    line_len = strlen(line);
    memcpy(http_header_buf+http_header_size, line, line_len);
    http_header_size += line_len;
    return line_len;
}

int http_header_add_int(int number) {
    int number_str_len;
    unsigned char *ptr;
    if (http_header_buf_len - http_header_size < 32) {
        fprintf(stderr, "Error: http_header_buf has only %d bytes left (32 bytes needed)\n", http_header_buf_len-http_header_size);
        free(buf);
        return -1;
    }
    ptr = http_header_buf+http_header_size;
    memset((char*)ptr, 0, 32);
    sprintf((char*)ptr, "%d", number);
    number_str_len = strlen((char*)ptr);
    http_header_size += number_str_len;
    return number_str_len;
}

/*
static inline void swap_uint32(uint32_t *num) {
    *num = (*num & 0x000000ffu) << 24u |
           (*num & 0x0000ff00u) << 8u  |
           (*num & 0x00ff0000u) >> 8u  |
           (*num & 0xff000000u) >> 24u;
}
*/

#define IBS 4194304
#define OBS 262144

int main(int argc, char **argv) {
    int i = 0, j = 0;
    unsigned char *_buf_;
    int buf_size = 0;
    int read_size = 0, size_to_read = 0, written_size = 0, size_to_write = 0, total_size_written = 0, remaining_write_size = 0;

    int write_fd = -1;
    int listen_sock_fd = -1, accept_sock_fd = -1;
    struct sockaddr_in listen_addr;
    fd_set accept_fdset; struct timeval timeout_timeval; struct timeval *timeout_timeval_ptr; int select_ret = -1;
    int accept_sock_flags = -1;
    struct linger struct_linger;

    int invalid_arg = parse_args(argc, argv);
    if (invalid_arg != VALID_ARG) return invalid_arg;

    if (http || test_port) {
        if (test_length) {
            fprintf(stderr, "Output length test (\"-l\") cannot be specified at same time when HTTP (\"-hPORT\") or port test (\"-tPORT\") is also specified\n");
            return 1;
        }

        if (test_port > 0) http = test_port;
        if (http < 1 || http > 65535) {
            fprintf(stderr, "PORT is out of range\n");
            return 1;
        }

        listen_sock_fd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (listen_sock_fd == -1) {
            perror("socket() failed");
            return 255;
        }
        if (setsockopt(listen_sock_fd, SOL_SOCKET, SO_REUSEADDR, &(int){1}, sizeof(int)) < 0) {
            perror("setsockopt() SO_REUSEADDR failed");
            return 255;
        }
        memset(&listen_addr, 0, sizeof(listen_addr));
        listen_addr.sin_family = AF_INET;
        listen_addr.sin_addr.s_addr= inet_addr("127.0.0.1");
        listen_addr.sin_port = htons(http);
        if (bind(listen_sock_fd, (struct sockaddr*)&listen_addr, sizeof(listen_addr)) == -1) {
            perror("bind() failed");
            return 255;
        }
        if (listen(listen_sock_fd, 1) == -1) {
            perror("listen() failed");
            return 255;
        }
        if (test_port > 0) {
            fprintf(stderr, "Port %d is available\n", http);
            return 0;
        }
    }

    setvbuf(stdin, NULL, _IOFBF, IBS);
    buf_size = IBS;
    buf_chunk_head = NULL;
    buf_chunk_head = malloc(sizeof(buf_chunk_type));
    if (buf_chunk_head == NULL) {
        fprintf(stderr, "Cannot allocate memory.\n");
        return 2;
    }
    buf_chunk_head->buf = NULL; buf_chunk_head->next = NULL;
    buf_chunk_head->buf = malloc(buf_size);
    if (buf_chunk_head->buf == NULL) {
        fprintf(stderr, "Cannot allocate memory.\n");
        return 2;
    }
    buf_chunk = buf_chunk_head;
    ptr = buf_chunk->buf;
    size_to_read = IBS;
    int max_read_size = 0;
    while (1) {
        read_size = read(STDIN_FILENO, ptr, size_to_read);

        if (read_size < 0 || read_size > size_to_read || read_size > IBS) {
            fprintf(stderr, "Cannot read from stdin. read_size=%d", read_size);
            perror("");
            free_buf_chunks(buf_chunk_head);
            return 64;
        }

        scrdump_size += read_size;
        size_to_read -= read_size;
        if (read_size > max_read_size) max_read_size = read_size;

        if (read_size == 0) {
            break;
        } else if (buf_size - scrdump_size < IBS) {
            if (buf_size > 64*IBS) {
                fprintf(stderr, "screendump too large, exit.\n");
                free_buf_chunks(buf_chunk_head);
                return 128;
            }
            buf_chunk->next = NULL;
            buf_chunk->next = malloc(sizeof(buf_chunk_type));
            if (buf_chunk->next == NULL) {
                fprintf(stderr, "Cannot allocate memory.\n");
                free_buf_chunks(buf_chunk_head);
                return 2;
            }
            buf_chunk->next->buf = NULL; buf_chunk->next->next = NULL;
            buf_chunk->next->buf = malloc(IBS);
            if (buf_chunk->next->buf == NULL) {
                fprintf(stderr, "Cannot allocate memory.\n");
                free_buf_chunks(buf_chunk_head);
                return 2;
            }
            buf_size += IBS;
        }

        if (size_to_read > 0) {
            ptr += read_size;
        } else if (size_to_read == 0) {
            size_to_read = IBS;
            buf_chunk = buf_chunk->next;
            if (buf_chunk == NULL) {
                fprintf(stderr, "Error: buf_chunk->next == NULL\n");
                free_buf_chunks(buf_chunk_head);
                return 2;
            }
            ptr = buf_chunk->buf;
        } else {
            fprintf(stderr, "Error: size_to_read < 0\nsize_to_read=%d read_size=%d scrdump_size=%d\n", size_to_read, read_size, scrdump_size);
            free_buf_chunks(buf_chunk_head);
            return 2;
        }
    }

    buf = NULL;
    buf = malloc(buf_size);
    if (buf == NULL) {
        fprintf(stderr, "Cannot allocate memory.\n");
        free_buf_chunks(buf_chunk_head);
        return 2;
    }
    buf_chunk = buf_chunk_head;
    ptr = buf;
    while (buf_chunk != NULL) {
        if (buf_chunk->buf == NULL) {
            fprintf(stderr, "Error: buf_chunk->buf == NULL\n");
            free_buf_chunks(buf_chunk_head);
            return 2;
        }

        memcpy(ptr, buf_chunk->buf, IBS);
        free(buf_chunk->buf);
        buf_chunk->buf = NULL;

        buf_chunk = buf_chunk->next;
        ptr += IBS;
    }
    free_buf_chunks(buf_chunk_head);
    buf_chunk_head = NULL;

    ptr = buf;

    //fprintf(stderr, "debug: max_read_size=%d\n", max_read_size);

    if (buf[3] != 0 || buf [7] != 0) {
        fprintf(stderr, "Cannot parse image resolution.\n");
        free(buf);
        return 8;
    }
    scr_width = buf[0] + buf[1] * 256 + buf[2] * 4096;
    scr_height = buf[4] + buf[5] * 256 + buf[6] * 4096;
    px_count = scr_width * scr_height;
    px_size32 = px_count * 4;
    px_size24 = px_count * 3;
    line_size32 = scr_width * 4;
    line_size24 = scr_width * 3;

    scrdump_header_size = scrdump_size - px_size32;
    if (scrdump_header_size < 0 || (scrdump_header_size != 12 && scrdump_header_size != 16)) {
        fprintf(stderr, "Unknown header format. scrdump_header_size=%d\n", scrdump_header_size);
        free(buf);
        return 8;
    }

    switch (flip) {
    case 0:
        break;
    case 1: //horizontally flip
        ptr = buf + scrdump_header_size;
        tmp_buf = NULL;
        tmp_buf = malloc(4);
        if (tmp_buf == NULL) {
            fprintf(stderr, "Cannot allocate memory.\n");
            free(buf);
            return 2;
        }
        for (i=0; i<scr_height; i++) {
            flip_pixels(ptr, scr_width, 4);
            ptr += line_size32;
        }
        free(tmp_buf);
        ptr = buf;
        break;
    case 2: //vertically flip
        ptr = buf + scrdump_header_size;
        tmp_buf = NULL;
        tmp_buf = malloc(line_size32);
        if (tmp_buf == NULL) {
            fprintf(stderr, "Cannot allocate memory.\n");
            free(buf);
            return 2;
        }
        flip_pixels(ptr, scr_height, line_size32);
        free(tmp_buf);
        ptr = buf;
        break;
    default:
        fprintf(stderr, "Unknown flip=%d\n", flip);
        free(buf);
        return 16;
    }

    if (swap) {
        ptr = buf + scrdump_header_size;
        for (i=0; i<px_count; i++) {
//          swap_uint32((uint32_t*)ptr);
            *(uint32_t*)ptr = bswap_32(*(uint32_t*)ptr);
            ptr += 4;
        }
    }

    switch (del) {
    case 0:
        break;
    case 1:
    case 2:
    case 3:
    case 4:
        ptr = buf + scrdump_header_size + del - 1;
        ptr2 = ptr + 1;

        if (del >= 1 && del <= 3 && px_count >= 2) {
            memmove(ptr, ptr2, 3);
            ptr += 3;
            ptr2 += 4;
        }

        for (i=0; i<px_count-2; i++) {
            memmove(ptr, ptr2, 3);
            ptr += 3;
            ptr2 += 4;
        }

        if (del >= 1 && del <= 3) memmove(ptr, ptr2, 4-del);
        if (del == 4) memmove(ptr, ptr2, 3);
        break;
    default:
        fprintf(stderr, "Unknown del=%d\n", del);
        free(buf);
        return 16;
    }

    if (bmp || http) {
        move_distance = 0;
        move_length = 0;
        total_size_to_write = 0;

        if (bmp) {
            whole_image_file_size = bmp_header_size;
            move_distance += bmp_header_size - scrdump_header_size;
            if (del) {
                bmp_pixel_data_size = px_size24;
                move_length = px_size24; //move pixels only
            } else {
                bmp_pixel_data_size = px_size32;
                move_length = px_size32; //move pixels only
            }
            whole_image_file_size += bmp_pixel_data_size;
        } else {
            whole_image_file_size = scrdump_header_size;
            move_length = scrdump_header_size; //move all data, scrdump_header+pixels
            if (del) {
                whole_image_file_size += px_size24;
                move_length += px_size24;
            } else {
                whole_image_file_size += px_size32;
                move_length += px_size32;
            }
        }
        total_size_to_write += whole_image_file_size;

        if (http) {
            http_header_add_str("HTTP/1.1 200 OK\r\n");

            http_header_add_str("Content-Type: ");
            if (bmp) {
                http_header_add_str("image/bmp\r\n");
            } else {
                http_header_add_str("application/octect-stream\r\n");
            }

            http_header_add_str("Content-Length: ");
            if (http_header_add_int(whole_image_file_size) <= 0) {
                fprintf(stderr, "Error: http_header_add_int(whole_image_file_size=%d) failed\n", whole_image_file_size);
                free(buf);
                return 32;
            }
            http_header_add_str("\r\n");

            http_header_add_str("Connection: close\r\n\r\n");

            move_distance += http_header_size;
            total_size_to_write += http_header_size;
        } else {
            http_header_size = 0;
        }

        // reallocate more memory if needed
        if (total_size_to_write > buf_size) {
            buf_size += (move_distance / IBS + 1) * IBS;
            _buf_ = NULL;
            _buf_ = realloc(buf, buf_size);
            if (_buf_ == NULL) {
                fprintf(stderr, "Cannot reallocate memory.\n");
                free(buf);
                return 2;
            }
            ptr = _buf_ + (ptr - buf);
            buf = _buf_;
        }

        // move pixel (or whole screendump) data
        if (move_distance != 0) {
            move_src = buf;
            if (bmp) move_src += scrdump_header_size; // bmp: move pixels only
            memmove(move_src+move_distance, move_src, move_length);
        }

        // fill headers
        if (http) {
            ptr = buf;
            memcpy(ptr, http_header_buf, http_header_size);
        }

        if (bmp) {
            ptr = buf+http_header_size;
            memcpy(ptr, bmp_header_template, bmp_header_size);

            ptr = buf + http_header_size + whole_image_file_size_offset;
            ptr[0] =  whole_image_file_size & 0x000000ffu;
            ptr[1] = (whole_image_file_size & 0x0000ff00u) >> 8 ;
            ptr[2] = (whole_image_file_size & 0x00ff0000u) >> 16 ;
            ptr[3] = (whole_image_file_size & 0xff000000u) >> 24 ;

            ptr = buf + http_header_size + bmp_width_offset;
            ptr[0] =  scr_width & 0x000000ffu;
            ptr[1] = (scr_width & 0x0000ff00u) >> 8 ;
            ptr[2] = (scr_width & 0x00ff0000u) >> 16 ;
            ptr[3] = (scr_width & 0xff000000u) >> 24 ;

            ptr = buf + http_header_size + bmp_height_offset;
            ptr[0] =  scr_height & 0x000000ffu;
            ptr[1] = (scr_height & 0x0000ff00u) >> 8 ;
            ptr[2] = (scr_height & 0x00ff0000u) >> 16 ;
            ptr[3] = (scr_height & 0xff000000u) >> 24 ;

            ptr = buf + http_header_size + bmp_bit_depth_offset;
            if (del) {
                ptr[0] = 24u;
            } else {
                ptr[0] = 32u;
            }

            ptr = buf + http_header_size + bmp_pixel_data_size_offset;
            ptr[0] =  bmp_pixel_data_size & 0x000000ffu;
            ptr[1] = (bmp_pixel_data_size & 0x0000ff00u) >> 8 ;
            ptr[2] = (bmp_pixel_data_size & 0x00ff0000u) >> 16 ;
            ptr[3] = (bmp_pixel_data_size & 0xff000000u) >> 24 ;
        }
    } else {
        total_size_to_write = scrdump_size;
    }

    if (test_length) {
        fprintf(stderr, "%d\n", total_size_to_write);
        free(buf);
        return 0;
    }

    if (http) {
        FD_ZERO(&accept_fdset);
        FD_SET(listen_sock_fd, &accept_fdset);

        if (timeout < 0 || timeout > 3600) {
            fprintf(stderr, "timeout is out of range\n");
            free(buf);
            return 1;
        }
        timeout_timeval_ptr = NULL;
        if (timeout == 0) {
            timeout_timeval_ptr = NULL;
        } else {
            timeout_timeval.tv_sec = timeout;
            timeout_timeval.tv_usec = 0;
            timeout_timeval_ptr = &timeout_timeval;
        }

        select_ret = select(listen_sock_fd+1, &accept_fdset, NULL, NULL, timeout_timeval_ptr);
        if (select_ret == -1) {
            perror("select() failed\n");
            free(buf);
            return 255;
        }
        if (select_ret == 0) {
            fprintf(stderr, "select() time out\n");
            free(buf);
            return 254;
        }
        accept_sock_fd = accept(listen_sock_fd, NULL, NULL);
        if (accept_sock_fd == -1) {
            perror("accept() failed\n");
            free(buf);
            return 255;
        }
        struct_linger.l_onoff = 1;
        struct_linger.l_linger = 2;
        if (setsockopt(accept_sock_fd, SOL_SOCKET, SO_LINGER, &struct_linger, sizeof(struct_linger)) < 0) {
            perror("setsockopt SO_LINGER failed");
            free(buf);
            return 64;
        }
    } else {
        setvbuf(stdout, NULL, _IOFBF, OBS);
    }

    total_size_written = 0;
    remaining_write_size = total_size_to_write;
    ptr = buf;
    int max_written_size = 0;
    while(1) {
        if (remaining_write_size == 0) break;
        if (remaining_write_size < 0) {
            fprintf(stderr, "Error: remaining_write_size=%d < 0\n", remaining_write_size);
            free(buf);
            return 32;
        }

        if (remaining_write_size >= OBS) {
            size_to_write = OBS;
        } else {
            size_to_write = remaining_write_size;
        }

        if (http) {
            write_fd = accept_sock_fd;
        } else {
            write_fd = STDOUT_FILENO;
        }

        written_size = write(write_fd, ptr, size_to_write);

        if (written_size <= 0 || written_size > OBS) {
            if (http == 0) {
                fprintf(stderr, "Cannot write to stdout. written_size=%d", written_size);
                perror("");
            } else {
                fprintf(stderr, "Cannot write to socket. written_size=%d", written_size);
                perror("");
            }
            free(buf);
            return 64;
        }

        if (written_size > max_written_size) max_written_size = written_size;

        total_size_written += written_size;
        ptr += written_size;
        if (total_size_written > total_size_to_write) {
            fprintf(stderr, "Error: total_size_written=%d is larger than total_size_to_write=%d\n", total_size_written, total_size_to_write);
            free(buf);
            return 32;
        }
        remaining_write_size = total_size_to_write - total_size_written;
    }

    if (accept_sock_fd != -1) {
        shutdown(accept_sock_fd, SHUT_WR);
        accept_sock_flags = fcntl(accept_sock_fd, F_GETFL, NULL);
        if (accept_sock_flags == -1) {
            perror("fcntl(accept_sock_fd, FD_GETFL, NULL) failed");
            free(buf);
            return 64;
        }
        if (fcntl(accept_sock_fd, F_SETFL, accept_sock_flags | O_NONBLOCK) < 0) {
            perror("fcntl(accept_sock_fd, FD_SETFL, accept_sock_flags | O_NONBLOCK) failed");
            free(buf);
            return 64;
        }
        for (i=0; i<200; i++) {
            read_size = read(accept_sock_fd, http_header_buf, http_header_buf_len/2);
            if (read_size <=0 && errno != EAGAIN && errno != EWOULDBLOCK) break;
            usleep(10000);
        }
        shutdown(accept_sock_fd, SHUT_RDWR);
        close(accept_sock_fd);
    }
    if (listen_sock_fd != -1) close(listen_sock_fd);

    //fprintf(stderr, "debug: max_written_size=%d\n", max_written_size);
    free(buf);
    return 0;
}