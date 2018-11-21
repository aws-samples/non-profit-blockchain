/*
# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# or in the "license" file accompanying this file. This file is distributed
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
# express or implied. See the License for the specific language governing
# permissions and limitations under the License.
#
*/

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
