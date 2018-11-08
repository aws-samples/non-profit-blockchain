composer transaction submit --card admin@ngo --data  '{
 "$class": "org.hyperledger.composer.system.AddAsset",
 "resources": [
  {
   "$class": "org.mcldg.ngo.Donation",
   "donationId": "2210",
   "donationAmount": 100,
   "donationDate": "2018-09-20T12:41:59.582Z",
   "donor": "resource:org.mcldg.ngo.Donor#edge",
   "ngo": "resource:org.mcldg.ngo.NGO#6322"
  }
 ],
 "targetRegistry": "resource:org.hyperledger.composer.system.AssetRegistry#org.mcldg.ngo.Donation"
}'
