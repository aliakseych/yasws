export { normalizePath, removeStartSlash, addEndSlash }

function normalizePath(str: string): string {
  // Remove leading slash if exists
  str = removeStartSlash(str)

  // Add trailing slash, if there is not one
  str = addEndSlash(str)

  return str;
}

function addEndSlash(str: string): string {
  if (!str.endsWith("/")) {
    str += "/";
  }

  return str;
}

function removeStartSlash(str: string): string {
  if (str.startsWith("/")) {
    str = str.slice(1);
  }

  return str;
}
