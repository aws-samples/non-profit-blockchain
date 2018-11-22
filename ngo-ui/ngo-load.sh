set +e
export ENDPOINT=ngo10-elb-2090058053.us-east-1.elb.amazonaws.com
export PORT=80
#export ENDPOINT=localhost
#export PORT=3000
echo connecting to server: $ENDPOINT:$PORT
echo
echo '---------------------------------------'

echo 'Creating NGO - 1101'
echo

TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/ngos -H 'content-type: application/json' -d '{
    "ngoRegistrationNumber": "1101",
    "ngoName": "Making the Earth Green",
    "ngoDescription": "Our Earth is losing an estimated 18 million acres (7.3 million hectares) of forest every year. The impact of deforestation includes declining of biodiversity, ecological imbalances and climate changes around the world. If the current rate of deforestaion continues, it will take less than 100 years to destroy all the rainforests on Earth. Making the Earth Green, a non-profit organization, works with governments, companies and communities to educate and promote responsible forest management practices and protect forest areas. We strongly believe that our children and the future generations deserve better environment that the current state and it is our responsible to make it happen. Please donate to make the Earth greener!",
    "address": "101 Making the Earth Green",
    "contactNumber": "6304972628",
    "contactEmail": "makingearth@makingearth.com"
}')

echo "Transaction ID is $TRX_ID"

echo 'Creating NGO - 1102'
echo

TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/ngos -H 'content-type: application/json' -d '{
    "ngoRegistrationNumber": "1102",
    "ngoName": "Books Now Fund",
    "ngoDescription": "More than 330 million children, more than 90 percent of primary age children in low-income countries and 75 percent of children in lower-middle income countries, are not expected to read by the end of primary school1. Books Now Fund aims to bring the power of reading to children in these countries, to give them the opportunities to learn, and to encourage them to persue education. Your donation will help us making the world a better reading place for these children! 1. UNESCO Institute for Statistics. (2017). More Than One-Half of Children and Adolescents Are Not Learning Worldwide. Fact Sheet. Paris: UNESCO. [Accessed 26 January 2018].",
    "address": "201 Books Now Fund",
    "contactNumber": "6305932628",
    "contactEmail": "booksfund@booksfund.com"
}')

echo "Transaction ID is $TRX_ID"


echo 'Creating NGO - 1103'
echo

TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/ngos -H 'content-type: application/json' -d '{
    "ngoRegistrationNumber": "1103",
    "ngoName": "Animal Recuse Troop",
    "ngoDescription": "Animal Rescue Troop is a non-profit organization dedicated to animal welfare and shelter. We are volunteer-run and focus on rescuing, rehabilitating and finding forever homes for stray and abandoned animals. There are many ways that you can help them: by adopting an animal, providing temporary shelter, becoming a sponsor or donating to our pet shelter. Step up and show that you care!",
    "address": "301 Animal Recuse Troop",
    "contactNumber": "6309472628",
    "contactEmail": "animalrecuse@animalrecuse.com"
}')



echo "Transaction ID is $TRX_ID"

echo 'Creating NGO - 1104'
echo

TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/ngos -H 'content-type: application/json' -d '{
    "ngoRegistrationNumber": "1104",
    "ngoName": "Helping Hands",
    "ngoDescription": "Helping Hands is a homeless support group. A global survey conducted by United Nations in 2005, an estimated 100 million people were homeless worldwide and the number. Thousands of people around the United States currently face homelessness. During difficult times, the local non-profit organizations like us are vital in providing shelter and support to those in needs. We work with local businesses and non-profit partners delivering life-saving services in the communities such as delivering essential backpacks to homeless shelters, sourcing food donations and job placements. Everyone deserved a place to call home, we appreciate your donation to support local communities in overcoming adversity.",
    "address": "401 Helping Thousands",
    "contactNumber": "6307352628",
    "contactEmail": "helpinghands@helpinghands.com"
}')

echo "Transaction ID is $TRX_ID"

echo 'Creating NGO -1105'
echo

TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/ngos -H 'content-type: application/json' -d '{
    "ngoRegistrationNumber": "1105",
    "ngoName": "STEM Sprout",
    "ngoDescription": "STEM Sprout\u0027s goals is expanding access to Science, Technology, Engineering and Mathematics in schools and increasing participation in these fields of study. Over the next decade, many of the 30- fastest growing jobs will require STEM skills. We work with schools in our communities to organize activities and develop curriculum. We want to ensure that understanding techology become a basic skill for our next generations. Giving children the resources and empowering them to understand even the basics of sciences would open up so many options and opportunities for them down the road. Come and help to open doors to STEM for our children!",
    "address": "",
    "contactNumber": "",
    "contactEmail": ""
}')

echo "Transaction ID is $TRX_ID"
