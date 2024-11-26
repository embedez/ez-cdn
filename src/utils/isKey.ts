if (!(await Bun.file("keys.json").exists())) {
  console.log("keys.json not found, creating...");
  Bun.write("keys.json", JSON.stringify([]));
}

const keys = await Bun.file("keys.json").json();
export default (key: string) => {
  return keys.includes(key);
};
