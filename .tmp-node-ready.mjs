fetch('http://127.0.0.1:5050/api/ready')
  .then((r) => r.text())
  .then((t) => console.log(t))
  .catch((e) => {
    console.error(String(e));
    process.exit(1);
  });
