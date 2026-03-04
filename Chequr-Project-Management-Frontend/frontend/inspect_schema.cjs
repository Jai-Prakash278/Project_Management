const http = require('http');

const data = JSON.stringify({
  query: `
    {
      __type(name: "createSprintInput") {
        name
        inputFields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  `
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`Body length: ${body.length}`);
    if (body.length > 0) {
      console.log(`First char code: ${body.charCodeAt(0)}`);
    }
    try {
      const json = JSON.parse(body.trim());
      if (json.errors) {
        console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
      } else {
        const fields = json.data.__type.inputFields.map(f => {
          let typeName = f.type.name;
          if (!typeName && f.type.ofType) {
            typeName = f.type.ofType.name;
          }
          return { name: f.name, type: typeName || f.type.kind };
        });
        fs.writeFileSync('schema_fields.json', JSON.stringify(fields, null, 2));
        console.log("Written to schema_fields.json");
      }
    } catch (e) {
      console.error("Error parsing response: " + e.message);
      console.log("Raw body: " + JSON.stringify(body));
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
