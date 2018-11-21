import * as uuid from 'uuid';

class Ngo {
    id: string = null;
    ngo_name: string = null;
    ngo_reg_no: string = null;
    ngo_address: string = null;
    ngo_phone: string = null;
    ngo_email: string = null;
    ngo_website: string = null;
    ngo_Donors = 0;
    ngo_donations = 0;
    ngo_fund_utilized = 0;
    ngo_projects = 0;
    ngo_active_projects = 0;
    ngo_on_hold_projects = 0;
    ngo_complete_projects = 0;
    ngo_about: string = null;
    ngo_project_details: string = null;
    ngo_icon_url: string;
    ngo_gallary_url: string;
    ngo_rating = 0;
    ngo_user_rating = 0;

    ngo_funds_details = null;
    ngo_user_donations = 0.00;
    ngo_donor_details = new Map();
    ngo_spend_details = [];
    ngo_donors_list = [];
}

class Rating {
    ratingId: string = null;
    rating = 0;
    donorUserName: string = null;
    ngoRegistrationNumber: string = null;
    ratingDate = new Date();
    transactionId: string = null;


    constructor() {
    }

    set(rating: number, donor: string, ngo: string) {
        this.donorUserName = `${donor}`;
        this.ngoRegistrationNumber = `${ngo}`;
        this.rating = rating;
        this.ratingId = uuid.v4();
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
export { Ngo, Rating };

