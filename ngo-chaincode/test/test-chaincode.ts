import { MyChaincode } from '../src/ngo.js';
import { ChaincodeMockStub, Transform } from "@theledger/fabric-mock-stub";
import { expect } from "chai";

// You always need your chaincode so it knows which chaincode to invoke on
const chaincode = new MyChaincode();
describe('Test MyChaincode', () => {
    it("Should query ngo", async () => {
        const mockStub = new ChaincodeMockStub("MyMockStub", chaincode);
        
        const response = await mockStub.mockInvoke("tx2", ['queryDonor', `edge`]);
        expect(Transform.bufferToObject(response.payload)).to.deep.eq({
            'docType': 'donor',
            'donorUserName': 'edge',
            'email': 'edge@abc.com',
            'registeredDate': new Date()
        });
    });
});