composer transaction submit --card admin@ngo --data  '{
    "$class": "org.mcldg.ngo.donate",
    "donor": "resource:org.mcldg.ngo.Donor#edge",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "donationId": "123",
    "donationAmount": 90
}'

composer transaction submit --card admin@ngo --data  '{
    "$class": "org.mcldg.ngo.donate",
    "donor": "resource:org.mcldg.ngo.Donor#edge",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "donationId": "456",
    "donationAmount": 275
}'

composer transaction submit --card admin@ngo --data  '{
    "$class": "org.mcldg.ngo.donate",
    "donor": "resource:org.mcldg.ngo.Donor#braendle",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "donationId": "789",
    "donationAmount": 150
}'

composer transaction submit --card admin@ngo --data  '{
    "$class": "org.mcldg.ngo.donate",
    "donor": "resource:org.mcldg.ngo.Donor#braendle",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "donationId": "012",
    "donationAmount": 325
}'

composer transaction submit --card admin@ngo --data  '{
    "$class": "org.mcldg.ngo.donate",
    "donor": "resource:org.mcldg.ngo.Donor#edge",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "donationId": "345",
    "donationAmount": 115
}'
