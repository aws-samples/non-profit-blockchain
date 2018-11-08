/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** Transactions are used to model interactions that impact the assets in the model.
  * In this case, the assets are Donations that are either donated by Donors, or spent
  * by NGOs. Both the donation and spending of the donation impact the state of the ledger,
  * and are therefore represented as transactions. These transactions will be represented
  * as 'smart contracts' or chaincode in Hyperledger.
  */

/**
 * Record donations made to an NGO by a Donor
 * @param {org.mcldg.ngo.donate} donation - the donation to be recorded
 * @transaction
 */
async function donate(donation) {
    const factory = getFactory();
    console.log('##### Donation received: ' + donation);
    console.log('##### Donation ID: ' + donation.donationId);
    console.log('##### Donation amount: ' + donation.donationAmount);
    console.log('##### Donation donor: ' + donation.donor.donorUserName);
    console.log('##### Donation ngo: ' + donation.ngo.ngoName);
    const donorRegistry = await getParticipantRegistry('org.mcldg.ngo.Donor');
    let localDonor = await donorRegistry.get(donation.donor.donorUserName);
    const ngoRegistry = await getParticipantRegistry('org.mcldg.ngo.NGO');
    let localNGO = await ngoRegistry.get(donation.ngo.ngoRegistrationNumber);
    const donationRegistry = await getAssetRegistry('org.mcldg.ngo.Donation');
    let newDonation = factory.newResource("org.mcldg.ngo", "Donation", donation.donationId);
    newDonation.donor = localDonor;
    newDonation.ngo = localNGO;
    newDonation.donationAmount = donation.donationAmount;
    newDonation.donationDate = new Date();
    // emit a notification that a donation has been made
    const donationNotification = factory.newEvent('org.mcldg.ngo', 'DonationNotification');
    donationNotification.donation = newDonation;
    donationNotification.donationAmount = donation.donationAmount;
    donationNotification.ngoRegistrationNumber = donation.ngo.ngoRegistrationNumber;
    donationNotification.ngoName = donation.ngo.ngoName;
    donationNotification.donorUserName = donation.donor.donorUserName;
    emit(donationNotification);
    return donationRegistry.add(newDonation);
}
/**
 * Record spend made by an NGO
 * @param {org.mcldg.ngo.spend} spend - the spend to be recorded
 * @returns {org.mcldg.ngo.NGOSpend} The NGOSpend asset to return
 * @transaction
 */
async function spend(spend) {
  const factory = getFactory();
  console.log('##### Spend received: ' + spend);
  console.log('##### Spend ID: ' + spend.spendId);
  console.log('##### Spend description: ' + spend.spendDescription);
  console.log('##### Spend amount: ' + spend.spendAmount);
  console.log('##### Spend ngo: ' + spend.ngo.ngoName);
  // breakdown the spend amongst the donors, so each donor can see how their donations are spent
  // first, get the total amount of donations donated to this NGO
  let totalDonations = 0;
  //const donorMap = new Map();
  const donationMap = new Map();
  let donationsForNGO = await query('getDonationsForNGO', { ngo: spend.ngo.toURI() })
  console.log('##### getDonationsForNGO: ' + donationsForNGO);
  for (let n = 0; n < donationsForNGO.length; n++) {
    let donation = donationsForNGO[n];
    totalDonations += donation.donationAmount;
    // store the donations made
    var serializer = getSerializer();
    //let donationInfo = {'donationAmount': donation.donationAmount, 'donor': donation.donor, 'ngo': donation.ngo};
    let donationInfo = serializer.toJSON(donation);
    donationMap.set(donation.getIdentifier(), donationInfo);
    console.log('##### donationMap - adding new donation entry for donor: ' + donation.getIdentifier() + ', values: ' + donationInfo);
    // // store the donations made per Donor
    // if (donorMap.has(donation.donor.getIdentifier())) {
    //   donationAmt = donorMap.get(donation.donor.getIdentifier());
    //   donationAmt += donation.donationAmount;
    //   donorMap.set(donation.donor.getIdentifier(), donationAmt);
    //   console.log('##### donorMap - updating donation entry for donor: ' + donation.donor.getIdentifier() + 'amount: ' + donation.donationAmount + 'total amt: ' + donationAmt);
    // }
    // else {
    //   donorMap.set(donation.donor.getIdentifier(), donation.donationAmount);
    //   console.log('##### donorMap - adding new donation entry for donor: ' + donation.donor.getIdentifier() + 'amount: ' + donation.donationAmount);
    // }

    console.log('##### getDonationsForNGO Donation found: ' + donation);
    console.log('##### getDonationsForNGO Donation ID: ' + donation.donationId);
    console.log('##### getDonationsForNGO Donation amount: ' + donation.donationAmount);
    console.log('##### getDonationsForNGO Donation donor: ' + donation.donor);
    console.log('##### getDonationsForNGO Donation ngo: ' + donation.ngo);
    console.log('##### getDonationsForNGO Donation ngo uri: ' + donation.ngo.toURI());
    console.log('##### getDonationsForNGO Donation ngo string: ' + donation.ngo.toString());
    console.log('##### getDonationsForNGO Donation ngo rel: ' + donation.ngo.isRelationship());
    console.log('##### getDonationsForNGO Donation ngo id: ' + donation.ngo.getIdentifier());
    console.log('##### getDonationsForNGO Donation ngo full ID: ' + donation.ngo.getFullyQualifiedIdentifier());
    console.log('##### getDonationsForNGO Donation ngo type: ' + donation.ngo.getFullyQualifiedType());
    console.log('##### getDonationsForNGO Donation ngo resource: ' + donation.ngo.isResource());

    // const ngoRegistry = await getParticipantRegistry('org.mcldg.ngo.NGO');
    // let localNGO = await ngoRegistry.get(donation.ngo.getIdentifier());
    // console.log('##### getDonationsForNGO Donation ngo after await: ' + localNGO);
    // console.log('##### getDonationsForNGO Donation ngo name after await: ' + localNGO.ngoName);
  }
  console.log('##### Total donations for this ngo are: ' + totalDonations);
  for (let donation of donationMap) {
    var serializer = getSerializer();
    let donationInfo = serializer.fromJSON(donation[1]);
    console.log('##### Total donation for this donation ID: ' + donation[0] + ', amount: ' + donationInfo.donationAmount + ', entry: ' + donationInfo);  
  }

  // next, get the spend by Donation, i.e. the amount of each Donation that has already been spent
  let totalSpend = 0;
  let spendByDonation = await query('getSpendByDonation');
  console.log('##### getSpendByDonation: ' + spendByDonation);
  const donationSpendMap = new Map();
  for (let n = 0; n < spendByDonation.length; n++) {
    let spend = spendByDonation[n];
    totalSpend += spend.spendAllocationAmount;
    // store the spend made per Donation
    if (donationSpendMap.has(spend.donation.getIdentifier())) {
      spendAmt = donationSpendMap.get(spend.donation.getIdentifier());
      spendAmt += spend.spendAllocationAmount;
      donationSpendMap.set(spend.donation.getIdentifier(), spendAmt);
      console.log('##### donationSpendMap - updating donation entry for donation ID: ' + spend.donation.getIdentifier() + 'amount: ' + spend.spendAllocationAmount + 'total amt: ' + spendAmt);
    }
    else {
      donationSpendMap.set(spend.donation.getIdentifier(), spend.spendAllocationAmount);
      console.log('##### donationSpendMap - adding new donation entry for donation ID: ' + spend.donation.getIdentifier() + 'amount: ' + spend.spendAllocationAmount);
    }
  }
  console.log('##### Total spend for this ngo is: ' + totalSpend);
  for (let donation of donationSpendMap) {
    console.log('##### Total spend against this donation ID: ' + donation[0] + ', spend amount: ' + donation[1] + ', entry: ' + donation);  
    if (donationMap.has(donation[0])) {
      console.log('##### The matching donation for this donation ID: ' + donation[0] + ', donation amount: ' + donationMap.get(donation[0]));  
    }
    else {
      console.log('##### ERROR - cannot find the matching donation for this spend record for donation ID: ' + donation[0]);  
    }
  }

  // at this point we have the total amount of donations made by donors to each NGO. We also have the total spend
  // spent by an NGO with a breakdown per donation. 

  // confirm whether the NGO has sufficient available funds to cover the new spend
  let totalAvailable = totalDonations - totalSpend;
  if (spend.spendAmount > totalAvailable) {
    // Execution stops at this point; the transaction fails and rolls back.
    // Any updates made by the transaction processor function are discarded.
    // Transaction processor functions are atomic; all changes are committed,
    // or no changes are committed.
    console.log('##### NGO does not have sufficient funds available to cover this spend. Spend amount is: ' + spend.spendAmount + '. Available funds are currently: ' + totalAvailable + '. Total donations are: ' + totalDonations + ', total spend is: ' + totalSpend);
    throw new Error('NGO does not have sufficient funds available to cover this spend. Spend amount is: ' + spend.spendAmount + '. Available funds are currently: ' + totalAvailable);
  }

  // since the NGO has sufficient funds available, add the new spend record
  const ngoRegistry = await getParticipantRegistry('org.mcldg.ngo.NGO');
  let localNGO = await ngoRegistry.get(spend.ngo.ngoRegistrationNumber);
  const ngoSpendRegistry = await getAssetRegistry('org.mcldg.ngo.NGOSpend');
  console.log('##### Adding the spend record to NGOSpend. NGO is: ' + localNGO + '. Spend amount is: ' + spend.spendAmount);
  let newSpend = factory.newResource("org.mcldg.ngo", "NGOSpend", spend.spendId);
  newSpend.ngo = localNGO;
  newSpend.spendDescription = spend.spendDescription;
  newSpend.spendAmount = spend.spendAmount;
  newSpend.spendDate = new Date();
  let newSpendResource = await ngoSpendRegistry.add(newSpend);

  // allocate the spend as equally as possible to all the donations
  console.log('##### Allocating the spend amount amongst the donations from donors who donated funds to this NGO');
  // let numberOfDonations = donationsForNGO.length;   // I calculate this in the loop below
  let spendAmount = spend.spendAmount;
  const ngoSpendDonorRegistry = await getAssetRegistry('org.mcldg.ngo.NGOSpendDonationAllocation');
  const donationRegistry = await getAssetRegistry('org.mcldg.ngo.Donation');

  while (true) {
    // spendAmount will be reduced as the spend is allocated to NGOSpendDonationAllocation records. 
    // Once it reaches 0 we stop allocating. This caters for cases where the full allocation cannot
    // be allocated to a donation record. In this case, only the remaining domation amount is allocated 
    // (see variable amountAllocatedToDonation below).
    // The remaining amount must be allocated to donation records with sufficient available funds.
    if (spendAmount <= 0) {
      break;
    }
    //calculate the number of donations still available, i.e. donations which still have funds available for spending. 
    //as the spending reduces the donations there may be fewer and fewer donations available to split the spending between
    numberOfDonations = 0;
    for (let donation of donationMap) {
      if (donationSpendMap.has(donation[0])) {
        spendAmountForDonor = donationSpendMap.get(donation[0]);
      }
      else {
        spendAmountForDonor = 0;
      }
      let availableAmountForDonor = donation[1].donationAmount - spendAmountForDonor;
      console.log('##### Checking number number of donations available for allocation. Donation ID: ' +  donation[0] + ' has spent: ' + spendAmountForDonor + ' and has the following amount available for spending: ' + availableAmountForDonor);
      if (availableAmountForDonor > 0) {
        numberOfDonations++;
      }
    }
    //calculate how much spend to allocate to each donation
    let spendPerDonation = spendAmount / numberOfDonations;
    console.log('##### Allocating the total spend amount of: ' + spendAmount + ', to ' + numberOfDonations + ' donations, resulting in ' + spendPerDonation + ' per donation');
    for (let donation of donationMap) {
      let donationId = donation[0];
      let donationInfo = donation[1];
      //calculate how much of the donation's amount remains available for spending
      let donationAmount = donationInfo.donationAmount;
      if (donationSpendMap.has(donationId)) {
        spendAmountForDonor = donationSpendMap.get(donationId);
      }
      else {
        spendAmountForDonor = 0;
      }
      let availableAmountForDonor = donationAmount - spendAmountForDonor;
      //if the donation does not have sufficient funds to cover their allocation, then allocate
      //all of the outstanding donation funds
      let amountAllocatedToDonation = 0;
      if (availableAmountForDonor >= spendPerDonation) {
        amountAllocatedToDonation = spendPerDonation;
        console.log('##### donation ID ' + donationId + ' has sufficient funds to cover full allocation. Allocating: ' + amountAllocatedToDonation);
      }
      else if (availableAmountForDonor > 0) {
        amountAllocatedToDonation = availableAmountForDonor;
        // reduce the number of donations available since this donation record is fully allocated
        numberOfDonations -= 1;
        console.log('##### donation ID ' + donationId + ' does not have sufficient funds to cover full allocation. Using all available funds: ' + amountAllocatedToDonation);
      }
      else {
        // reduce the number of donations available since this donation record is fully allocated
        numberOfDonations -= 1;
        console.log('##### donation ID ' + donationId + ' has no funds available at all. Available amount: ' + availableAmountForDonor + '. This donation ID will be ignored');
        continue;
      }
      // add a new NGOSpendDonationAllocation entry containing the portion of a donation allocated to this spend
      // note, spendAllocationId will use a generated non-deterministic random number. The impact is that each peer node will have different values 
      // for this ID. This shouldn't be an issue as we do not need to identify specific spend allocation records.
      let spendAllocationId = Math.floor(Math.random() * Number.MAX_VALUE + 1); 
      let newSpendAllocation = factory.newResource("org.mcldg.ngo", "NGOSpendDonationAllocation", spendAllocationId.toString());
      newSpendAllocation.spendAllocationAmount = amountAllocatedToDonation;
      newSpendAllocation.spendAllocationDate = new Date();
      let localDonation = await donationRegistry.get(donationId);
      newSpendAllocation.donation = localDonation;
      newSpendAllocation.NGOSpend = newSpend;
      console.log('##### Creating new NGOSpendDonationAllocation record with ID: ' + spendAllocationId + ' for Donor: ' + localDonation + ', amount: ' + amountAllocatedToDonation + ', entry: ' + donation);  
      await ngoSpendDonorRegistry.add(newSpendAllocation);
      console.log('##### Created new NGOSpendDonationAllocation record with ID: ' + spendAllocationId + ' for Donor: ' + localDonation + ', amount: ' + amountAllocatedToDonation + ', entry: ' + donation);  

      //reduce the total spend amount by the amount just spent in the NGOSpendDonationAllocation record
      spendAmount -= amountAllocatedToDonation;

      //update the spending map entry for this NGO. There may be no existing spend, in which case we'll create an entry in the map
      if (donationSpendMap.has(donationId)) {
        spendAmt = donationSpendMap.get(donationId);
        spendAmt += amountAllocatedToDonation;
        donationSpendMap.set(donationId, spendAmt);
        console.log('##### donationSpendMap - updating spend entry for donation Id: ' + donationId + ' with spent amount allocated to donation: ' + amountAllocatedToDonation + ' - total amount of this donation now spent is: ' + spendAmt);
      }
      else {
        donationSpendMap.set(donationId, amountAllocatedToDonation);
        console.log('##### donationSpendMap - adding new spend entry for donation ID: ' + donationId + ' with spent amount allocated to donation: ' + amountAllocatedToDonation);
      }
    }
  }
  // emit a notification that an NGO has spent funds
  const spendNotification = factory.newEvent('org.mcldg.ngo', 'SpendNotification');
  spendNotification.spend = newSpend;
  spendNotification.spendAmount = spend.spendAmount;
  spendNotification.spendDescription = spend.spendDescription;
  spendNotification.ngoName = spend.ngo.ngoName;
  emit(spendNotification);
   
  // return the NGOSpend asset to the calling application
  return newSpend;
}
/**
 * Record ratings made by a Donor with respect to an NGO
 * @param {org.mcldg.ngo.rate} rating - the rating to be recorded
 * @transaction
 */
async function rate(rating) {
  const factory = getFactory();
  console.log('##### Rating received: ' + rating);
  console.log('##### Rating ID: ' + rating.ratingId);
  console.log('##### Rating: ' + rating.rating);
  console.log('##### Rating donor: ' + rating.donor.donorUserName);
  console.log('##### Rating ngo: ' + rating.ngo.ngoName);
  const donorRegistry = await getParticipantRegistry('org.mcldg.ngo.Donor');
  let localDonor = await donorRegistry.get(rating.donor.donorUserName);
  const ngoRegistry = await getParticipantRegistry('org.mcldg.ngo.NGO');
  let localNGO = await ngoRegistry.get(rating.ngo.ngoRegistrationNumber);
  const ratingRegistry = await getAssetRegistry('org.mcldg.ngo.Rating');
  let newRating = factory.newResource("org.mcldg.ngo", "Rating", rating.ratingId);
  newRating.donor = localDonor;
  newRating.ngo = localNGO;
  newRating.rating = rating.rating;
  newRating.ratingDate = new Date();
  return ratingRegistry.add(newRating);
}
const { inspect } = require('util');
const { BusinessNetworkConnection } = require('composer-client');

async function getBlock() {
  const connection = new BusinessNetworkConnection();

  // Connect to the blockchain using admin credentials.
  // These credentials should be available in your local keystore.
  await connection.connect('admin@network');

  // Native API provided through the Fabric SDK, allows much more low-level operations than Composer.
  const nativeApi = connection.getNativeAPI();

  // Connect to the channel where the transactions are happening, the default is "composerchannel".
  const channel = nativeApi.getChannel('composerchannel');

  // Grab a block by it's number
  const block = await channel.queryBlock(4);

  // Enter the matrix
  console.log(inspect(block, { depth: null, colors: true, compact: false }));

  await connection.disconnect();
}