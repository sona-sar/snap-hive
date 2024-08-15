function makeKey(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

function formatTime(isoString) {
  const date = new Date(isoString);

  const options = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  return date.toLocaleTimeString("en-US", options);
}

export { makeKey, formatTime };
