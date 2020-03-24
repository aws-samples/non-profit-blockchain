PROFILEDIR=../listener/src
LOCALCA=/usr/src/app/certs/managedblockchain-tls-chain.pem

#copy the connection profiles
cp $PROFILEDIR/connection-profile-template.yaml $PROFILEDIR/connection-profile.yaml

#update the connection profiles with endpoints and other information
sed -i "s|%PEERNODEID%|$PEERNODEID|g" $PROFILEDIR/connection-profile.yaml
sed -i "s|%MEMBERID%|$MEMBERID|g" $PROFILEDIR/connection-profile.yaml
sed -i "s|%CAFILE%|$LOCALCA|g" $PROFILEDIR/connection-profile.yaml
sed -i "s|%ORDERINGSERVICEENDPOINT%|$ORDERINGSERVICEENDPOINT|g" $PROFILEDIR/connection-profile.yaml
sed -i "s|%ORDERINGSERVICEENDPOINTNOPORT%|$ORDERINGSERVICEENDPOINTNOPORT|g" $PROFILEDIR/connection-profile.yaml
sed -i "s|%PEERSERVICEENDPOINT%|$PEERSERVICEENDPOINT|g" $PROFILEDIR/connection-profile.yaml
sed -i "s|%PEERSERVICEENDPOINTNOPORT%|$PEERSERVICEENDPOINTNOPORT|g" $PROFILEDIR/connection-profile.yaml
sed -i "s|%PEEREVENTENDPOINT%|$PEEREVENTENDPOINT|g" $PROFILEDIR/connection-profile.yaml
sed -i "s|%CASERVICEENDPOINT%|$CASERVICEENDPOINT|g" $PROFILEDIR/connection-profile.yaml