module.exports = () => {
  let date = new Date();

  let hours = date.getHours().toString().padStart(2, "0");

  let minutes = date.getMinutes().toString().padStart(2, "0");
  let seconds = date.getSeconds().toString().padStart(2, "0");
  let time = `${hours}:${minutes}:${seconds}`;
  return time;
};
