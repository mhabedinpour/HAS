export declare enum TLVMethods {
    pairSetup = 1,
    pairVerify = 2,
    addPairing = 3,
    removePairing = 4,
    listPairings = 5,
}
export declare enum TLVErrors {
    unknown = 1,
    authentication = 2,
    backOff = 3,
    maxPeers = 4,
    maxTries = 5,
    unavailable = 6,
    busy = 7,
}
export declare enum TLVValues {
    method = 0,
    identifier = 1,
    salt = 2,
    publicKey = 3,
    proof = 4,
    encryptedData = 5,
    state = 6,
    error = 7,
    retryDelay = 8,
    certificate = 9,
    signature = 10,
    permissions = 11,
    fragmentData = 12,
    fragmentLast = 13,
    separator = 255,
}
