const fs = require('fs');
try {
    const content = fs.readFileSync('schema_output.json', 'utf16le');
    const json = JSON.parse(content);
    const fields = json.data.__type.inputFields.map(f => {
        let typeName = f.type.name;
        if (!typeName && f.type.ofType) {
            typeName = f.type.ofType.name;
        }
        return { name: f.name, type: typeName || f.type.kind };
    });
    console.log(JSON.stringify(fields, null, 2));
} catch (e) {
    console.error(e);
}
