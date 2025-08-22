import { IShelf } from "./Shelf";

// interface IAuth {

// }

class SHAuth {
  hash: string =
    "ad1b033f4885a8bc3ae4f055f591a79c59ce73a6a7380b00c4fcb75ac3eefffb";
  validated: boolean = false;
  storage: IShelf;

  constructor(storage: IShelf) {
    this.storage = storage;
    // return SHAuth
  }

  async remember(str: string) {
    await this.storage.set({ auth: str });
  }
  validate(str: string) {
    const correct = str === this.hash;
    this.validated = correct;
    return correct;
  }
  async tryLogin() {
    const r = await this.storage.get("auth");
    // console.log(r)
    return this.validate(r["auth"]);
  }
  async authenticate(message: string) {
    if (this.validated) {
      return true;
    }
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashString = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    this.remember(hashString);
    // alert(hashString)
    return this.validate(hashString);
  }
}

export { SHAuth };
