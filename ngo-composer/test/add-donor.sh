composer transaction submit --card admin@ngo --data  '{
 "$class": "org.hyperledger.composer.system.AddParticipant",
 "resources": [
  {
   "$class": "org.mcldg.ngo.Donor",
   "donorUserName": "edge",
   "email": "edge@abc.com",
   "registeredDate": "2018-09-20T12:28:24.082Z"
  }
 ],
 "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.mcldg.ngo.Donor"
}'

composer transaction submit --card admin@ngo --data  '{
 "$class": "org.hyperledger.composer.system.AddParticipant",
 "resources": [
  {
   "$class": "org.mcldg.ngo.Donor",
   "donorUserName": "braendle",
   "email": "braendle@def.com",
   "registeredDate": "2018-09-22T12:32:24.082Z"
  }
 ],
 "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.mcldg.ngo.Donor"
}'
