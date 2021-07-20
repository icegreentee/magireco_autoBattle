#!/bin/bash

VERSIONNAME=$(grep -m1 "versionName" project.json | tr -d ':",' | awk '{print $2}')
echo -ne "Updating \"version\" variable in main.js ..."
sed -i "s/^var version *= *\"[^\"]*\"/var version = \"${VERSIONNAME}\"/g" main.js
echo -ne "DONE!\n\n"

echo -ne "Disabling \"isDevMode\" in main.js ..."
sed -i "s/^const isDevMode *= .*/const isDevMode = false;/g" main.js
echo -ne "DONE!\n\n"

echo -ne "Regenerating hashes for main.js and floatUI.js ..." >&2
echo -ne "[" > main-sha256-hashes.json
for FILE in main.js floatUI.js; do
    echo -ne "{"
    echo -ne "\"fileName\":\"${FILE}\","
    echo -ne "\"fileDir\":\"\","
    HASH=$(sed -e 's/\x0d//g' "${FILE}" | sha256sum | awk '{print $1}')
    echo -ne "\"fileHash\":\"${HASH}\","
    echo -ne "\"fileVersion\":\"${VERSIONNAME}\""
    echo -ne "},"
done | sed -e 's/\,$//g' >> main-sha256-hashes.json
echo -ne "]" >> main-sha256-hashes.json
git add main-sha256-hashes.json

if [ ! -d modules ]; then
    echo "Directory \"modules\" does not exist." >&2
    exit 1
fi
echo -ne "DONE!\n\n" >&2

cd modules

for SUBDIR in *; do
    if [ -d "${SUBDIR}" ]; then
        echo -ne "Regenerating hashes for module ${SUBDIR} ...\n" >&2
        cd "${SUBDIR}"
        echo -ne "[" > "${SUBDIR}-sha256-hashes.json"
        find . | grep -v '^\.$' | grep -v -- '-sha256-hashes\.json$' | sed -e 's/^\.\///g' | while read FILE; do
            if [ ! -f "${FILE}" ]; then continue; fi
            echo -ne "{"
            echo -ne "\"fileName\":\"${FILE}\","
            DIRNAME=$(dirname "modules/${SUBDIR}/${FILE}")
            echo -ne "  ${DIRNAME} ${FILE}..." >&2
            echo -ne "\"fileDir\":\"${DIRNAME}\","
            if [[ "${FILE}" == *".js" ]] || [[ "${FILE}" == *".json" ]] || [[ "${FILE}" == *".c" ]] || [[ "${FILE}" == *".txt" ]]; then
                echo -ne " strip CR..." >&2
                HASH=$(sed -e 's/\x0d//g' "${FILE}" | sha256sum | awk '{print $1}')
            else
                HASH=$(sha256sum "${FILE}" | awk '{print $1}')
            fi
            echo -ne "DONE!\n" >&2
            echo -ne "\"fileHash\":\"${HASH}\","
            echo -ne "\"fileVersion\":\"${VERSIONNAME}\""
            echo -ne "},"
        done | sed -e 's/\,$//g' >> "${SUBDIR}-sha256-hashes.json"
        echo -ne "]" >> "${SUBDIR}-sha256-hashes.json"
        git add "${SUBDIR}-sha256-hashes.json"
        cd ..
        echo -ne "DONE!\n\n" >&2
    fi
done
cd ..
