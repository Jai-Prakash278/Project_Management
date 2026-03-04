import http from 'http';

const query = JSON.stringify({
    query: `
    query IntrospectionQuery {
      __type(name: "User") {
        fields {
          name
          type {
            kind
            ofType {
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
        'Content-Length': query.length
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                const fields = json.data.__type.fields;
                const orgField = fields.find(f => f.name === 'organizationId');
                console.log("OrganizationId Field:", JSON.stringify(orgField, null, 2));
            } catch (e) {
                console.log("Error parsing:", e);
            }
        } else {
            console.log("Status:", res.statusCode);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(query);
req.end();
