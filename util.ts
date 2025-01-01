import readline from "readline";

export function toContinue(continueFunc: () => Promise<void>) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question(
    "Do you want to download this version? (y/n): ",
    async (answer) => {
      switch (answer.toLowerCase()) {
        case "y":
          // Put your code to continue here
          await continueFunc();
          break;
        case "n":
          console.log("Goodbye!");
          rl.close();
          break;
        default:
          console.log("Please enter Y or N");
          toContinue(continueFunc);
          break;
      }
    },
  );
}
