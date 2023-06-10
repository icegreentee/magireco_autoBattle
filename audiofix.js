"nodejs";

const fs = require("fs");
const path = require("path");

const EM_AARCH64 = 0xb7, EM_ARM = 0x28;
const ELFCLASS64 = 2, ELFCLASS32 = 1;

function parseElf(elf) {
    let result = {};

    // parse elf header
    const read_e_ident = elf.subarray(0, 16);
    if (Buffer.compare(Buffer.from([0x7f, 0x45, 0x4c, 0x46]), read_e_ident.subarray(0, 4)) != 0) {
        throw new Error("not ELF");
    }

    const eh = result.elf_header = {
        e_ident: {
            ei_class_2: read_e_ident.readUInt8(4),
            ei_data: read_e_ident.readUInt8(5),
            ei_version: read_e_ident.readUInt8(6),
            ei_osabi: read_e_ident.readUInt8(7),
            ei_abiversion: read_e_ident.readUInt8(8),
            ei_nident_SIZE: read_e_ident.readUInt8(0xf),
        },
        e_type: elf.readUInt16LE(0x10),
        e_machine: elf.readUInt16LE(0x12),
        e_version: elf.readUInt32LE(0x14),
    }

    if (result.elf_header.e_ident.ei_nident_SIZE != 0) {
        throw new Error("ei_nident_SIZE != 0");
    }

    let is64 = true;
    let e_flags_offset = 0x30;
    switch (eh.e_ident.ei_class_2) {
        case ELFCLASS64:
            if (eh.e_machine != EM_AARCH64) {
                throw new Error(`e_machine (${eh.e_machine}) != EM_AARCH64`);
            }
            is64 = true;
            eh.e_entry_START_ADDRESS = Number(elf.readBigUInt64LE(0x18));
            eh.e_phoff_PROGRAM_HEADER_OFFSET_IN_FILE = Number(elf.readBigUInt64LE(0x20));
            eh.e_shoff_SECTION_HEADER_OFFSET_IN_FILE = Number(elf.readBigUInt64LE(0x28));
            e_flags_offset = 0x30;
            break;
        case ELFCLASS32:
            if (eh.e_machine != EM_ARM) {
                throw new Error(`eh.e_machine (${eh.e_machine}) != EM_ARM`);
            }
            is64 = false;
            eh.e_entry_START_ADDRESS = elf.readUInt32LE(0x18);
            eh.e_phoff_PROGRAM_HEADER_OFFSET_IN_FILE = elf.readUInt32LE(0x1c);
            eh.e_shoff_SECTION_HEADER_OFFSET_IN_FILE = elf.readUInt32LE(0x20);
            e_flags_offset = 0x24;
            break;
        default:
            throw new Error(`unknown ei_class_2 = ${eh.e_ident.ei_class_2}`);
    }

    eh.e_flags = elf.readUInt32LE(e_flags_offset);
    eh.e_ehsize_ELF_HEADER_SIZE = elf.readUInt16LE(e_flags_offset + 4);
    eh.e_phentsize_PROGRAM_HEADER_ENTRY_SIZE_IN_FILE = elf.readUInt16LE(e_flags_offset + 6);
    eh.e_phnum_NUMBER_OF_PROGRAM_HEADER_ENTRIES = elf.readUInt16LE(e_flags_offset + 8);
    eh.e_shentsize_SECTION_HEADER_ENTRY_SIZE = elf.readUInt16LE(e_flags_offset + 10);
    eh.e_shnum_NUMBER_OF_SECTION_HEADER_ENTRIES = elf.readUInt16LE(e_flags_offset + 12);
    eh.e_shtrndx_STRING_TABLE_INDEX = elf.readUInt16LE(e_flags_offset + 14);


    // parse section header
    const sh = result.section_header_table = [];

    const shoff = eh.e_shoff_SECTION_HEADER_OFFSET_IN_FILE;
    const shnum = eh.e_shnum_NUMBER_OF_SECTION_HEADER_ENTRIES;
    const shentsize = eh.e_shentsize_SECTION_HEADER_ENTRY_SIZE;
    const read_shtab = elf.subarray(shoff, shoff + shentsize * shnum);
    const shtrndx = eh.e_shtrndx_STRING_TABLE_INDEX;

    const read_shstrtab = elf.subarray(shoff + shentsize * shtrndx);
    const strtab_offset = is64 ? Number(read_shstrtab.readBigUInt64LE(24)) : read_shstrtab.readUInt32LE(16);
    const strtab_size = is64 ? Number(read_shstrtab.readBigUInt64LE(32)) : read_shstrtab.readUInt32LE(20);
    const read_strtab = elf.subarray(strtab_offset, strtab_offset + strtab_size);

    for (let i = 0, offset = 0; i < shnum; i++, offset += shentsize) {
        let read_entry = read_shtab.subarray(offset, offset + shentsize);
        let s_name_off = read_entry.readUInt32LE(0);
        let s_name_str = read_strtab.subarray(s_name_off, read_strtab.indexOf(0x00, s_name_off)).toString("ascii");
        sh.push({
            s_name: {
                s_name_off: s_name_off,
                s_name_str: s_name_str,
            },
            s_type: read_entry.readUInt32LE(4),
            s_flags: read_entry.readUInt32LE(8),
            s_addr: is64 ? Number(read_entry.readBigUInt64LE(16)) : read_entry.readUInt32LE(12),
            s_offset: is64 ? Number(read_entry.readBigUInt64LE(24)) : read_entry.readUInt32LE(16),
            s_size: is64 ? Number(read_entry.readBigUInt64LE(32)) : read_entry.readUInt32LE(20),
            s_link: read_entry.readUInt32LE(is64 ? 40 : 24),
            s_info: read_entry.readUInt32LE(is64 ? 44 : 28),
            s_addralign: is64 ? Number(read_entry.readBigUInt64LE(48)) : read_entry.readUInt32LE(32),
            s_entsize: is64 ? Number(read_entry.readBigUInt64LE(56)) : read_entry.readUInt32LE(36),
        });
    }


    //parse dynamic symbol table
    const dynsym = result.dynamic_symbol_table = [];

    const dynsym_sec = sh.find((entry) => entry.s_name.s_name_str === ".dynsym");
    const dynsym_secoffset = dynsym_sec.s_offset;
    const dynsym_secsize = dynsym_sec.s_size;
    const dynsym_entsize = dynsym_sec.s_entsize;
    if (dynsym_entsize <= 0) {
        throw new Error(`dynsym_entsize ${dynsym_entsize} <= 0`);
    }
    const read_dynsym = elf.subarray(dynsym_secoffset, dynsym_secoffset + dynsym_secsize);

    const dynstr_sec = sh.find((entry) => entry.s_name.s_name_str === ".dynstr");
    const dynstr_secoffset = dynstr_sec.s_offset;
    const dynstr_secsize = dynstr_sec.s_size;
    const read_dynstr = elf.subarray(dynstr_secoffset, dynstr_secoffset + dynstr_secsize);
    for (
        let i = 0, offset = 0;
        offset + dynsym_entsize <= dynsym_secsize;
        i++, offset += dynsym_entsize
    ) {
        let read_entry = read_dynsym.subarray(offset, offset + dynsym_entsize);
        let sym_name_off = read_entry.readUInt32LE(0);
        let sym_name_str = read_dynstr.subarray(sym_name_off, read_dynstr.indexOf(0x00, sym_name_off)).toString("ascii");
        dynsym.push({
            sym_name: {
                sym_name_off: sym_name_off,
                sym_name_str: sym_name_str,
            },
            sym_info: read_entry.readUInt8(is64 ? 4 : 12),
            sym_other: read_entry.readUInt8(is64 ? 5 : 13),
            sym_shndx: read_entry.readUInt16LE(is64 ? 6 : 14),
            sym_value: is64 ? Number(read_entry.readBigUInt64LE(8)) : read_entry.readUInt32LE(4),
            sym_size: is64 ? Number(read_entry.readBigUInt64LE(16)) : read_entry.readUInt32LE(8),
        });
    }

    return result;
}

function getTargetFunction(elf, info, funcName, funcOffset, bufLen) {
    const syment = info.dynamic_symbol_table.find((entry) => entry.sym_name.sym_name_str === funcName);
    const offset = syment.sym_value;
    const size = syment.sym_size;
    const func = elf.subarray(offset, offset + size);
    if (funcOffset + bufLen > func.length) throw new Error("funcOffset + bufLen > func.length");
    return func.subarray(funcOffset, funcOffset + bufLen);
}

function checkFunction(elf, info, funcName, funcOffset, buf) {
    const target = getTargetFunction(elf, info, funcName, funcOffset, buf.length);
    return Buffer.compare(target, buf) == 0;
}

function patchFunction(elf, info, funcName, funcOffset, buf) {
    const target = getTargetFunction(elf, info, funcName, funcOffset, buf.length);
    buf.copy(target);
}

const wdir = path.join(process.cwd(), "audio_sr_fix");
fs.writeFileSync(path.join(wdir, "running"), "");

const libname = "libmadomagi_native.so";
const funcToPatch = "criNcv_GetHardwareSamplingRate_ANDROID";
const abiList = {
    "arm64-v8a": [
        {
            funcName: funcToPatch,
            checkList: [
                {
                    offset: 8,
                    buf: [0xc0, 0x03, 0x5f, 0xd6],
                }
            ],
            patchList: [
                {
                    offset: 4,
                    buf: [0x00, 0x70, 0x97, 0x52],
                },
            ],
        },
    ],
    "armeabi-v7a": [
        {
            funcName: funcToPatch,
            checkList: [
                {
                    offset: 8,
                    buf: [0x1e, 0xff, 0x2f, 0xe1],
                }
            ],
            patchList: [
                {
                    offset: 4,
                    buf: [0x80, 0x0b, 0x0b, 0xe3],
                },
            ],
        },
    ],
}

for (let abi in abiList) {
    let filepath = path.join(wdir, "lib", abi, libname);
    if (!fs.existsSync(filepath)) {
        console.log(`skipped nonexist file ${filepath}`);
        continue;
    }
    let filedata = fs.readFileSync(filepath);
    console.log(`patching ${filepath}`);
    let info = parseElf(filedata);
    abiList[abi].forEach((patchInfo) => {
        let mismatch = patchInfo.checkList.find((check) => !checkFunction(filedata, info, patchInfo.funcName, check.offset, Buffer.from(check.buf)));
        if (mismatch != null) throw new Error("check failed");
        patchInfo.patchList.forEach((patch) => patchFunction(filedata, info, patchInfo.funcName, patch.offset, Buffer.from(patch.buf)));
    });
    let writeToPath = path.join(wdir, "lib", abi, libname);
    fs.writeFileSync(writeToPath, filedata);
    console.log(`written patched file to ${writeToPath}`);
};

fs.writeFileSync(path.join(wdir, "done"), "");