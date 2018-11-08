composer transaction submit --card admin@ngo --data  '{
 "$class": "org.hyperledger.composer.system.AddParticipant",
 "resources": [
    {
    "$class": "org.mcldg.ngo.NGO",
    "ngoRegistrationNumber": "6322",
    "ngoName": "Pets In Need",
    "ngoDescription": "We help pets in need",
    "address": "1 Pet street",
    "contactNumber": "82372837",
    "contactEmail": "pets@petco.com"
    }
 ],
 "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.mcldg.ngo.NGO"
}'
