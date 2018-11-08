composer transaction submit --card admin@ngo --data  '{
    "$class": "org.mcldg.ngo.rate",
    "donor": "resource:org.mcldg.ngo.Donor#edge",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "ratingId": "123",
    "rating": 5
}'

composer transaction submit --card admin@ngo --data  '{
    "$class": "org.mcldg.ngo.rate",
    "donor": "resource:org.mcldg.ngo.Donor#braendle",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "ratingId": "456",
    "rating": 4
}'
