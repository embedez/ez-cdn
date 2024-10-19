export default (token: string) => {
  return token.replace("Bearer ", "");
};
