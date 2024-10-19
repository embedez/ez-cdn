const keys = process.env.keys.split("|");
export default (key: string) => {
  return keys.includes(key);
};
