import * as uuid from 'uuid';

class Donation {
    id: string = null;
    Donor_id: string = null;
    ngo_id: string = null;
    ngo_name: string = null;
    project_id: string = null;
    status: string = null;
    amount = 0;
    utilized = 0;
    transaction_id: string = null;
    date: Date = null;
}
class Donate {
    donationId: string = null;
    donationAmount: number = null;
    donationDate: string = null;
    donorUserName: string = null;
    ngoRegistrationNumber: string = null;
    constructor() {

    }

    set(donationAmount: number, donor: string, ngo: string) {
        this.donationId = uuid.v4();
        this.donationAmount = donationAmount;
        this.donationDate = '';
        this.donorUserName = donor;
        this.ngoRegistrationNumber = ngo;
        return this;
    }

    toString() {
        try {
            return JSON.stringify(this);
        } catch (error) {
            // do nothing;
        }
        return null;
    }
}
export { Donation, Donate };
