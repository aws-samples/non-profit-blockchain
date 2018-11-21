export class Donor {
    id: string = null;
    name: string = null;
    email: string = null;
    password: string = null;

    constructor() { }


    get(name: string, email: string) {
        this.name = name;
        this.email = email;
        this.id = name;
        return this;
    }

}
