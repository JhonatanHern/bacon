/*
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
*/
function isValidEntryType (entryType) {
  // Add additonal entry types here as they are added to dna.json.
  switch(entryType){
    case 'transaction':
    case 'link':
      return true
  }
  return false
}
function getCreator (hash) {
  return get(hash, { GetMask: HC.GetMask.Sources })[0];
}
function genesis () {
  return true;
}

/**
 * Validation callback: Can this entry be committed to a source chain?
 *
 * @param  {string} entryType Type of the entry as per DNA config for this zome.
 * @param  {string|object} entry Data with type as per DNA config for this zome.
 * @param  {Header-object} header Header object for this entry.
 * @param  {Package-object|null} pkg Package object for this entry, if exists.
 * @param  {string[]} sources Array of agent hashes involved in this commit.
 * @return {boolean} true if this entry may be committed to a source chain.
 *
 * @see https://developer.holochain.org/API#validateCommit_entryType_entry_header_package_sources
 * @see https://developer.holochain.org/Validation_Functions
 */
function validateCommit (entryType, entry, header, pkg, sources) {
  debug(entry)
  switch(entryType){
    case 'transaction':
      return true
    case 'link':
      if (entry.Base === 'in') {
        return 
      }else if(entry.Base === 'out'){
        return 
      }
  }
  return false
}
function validatePut (entryType, entry, header, pkg, sources) {
  return validateCommit(entryType, entry, header, pkg, sources);
}
function validateMod (entryType, entry, header, replaces, pkg, sources) {
  return validateCommit(entryType, entry, header, pkg, sources)
    // Only allow the creator of the entity to modify it.
    && getCreator(header.EntryLink) === getCreator(replaces);
}
function validateDel (entryType, hash, pkg, sources) {
  return false;
}
function validatePutPkg (entryType) {
  return null;
}

function validateModPkg (entryType) {
  return null;
}
function validateDelPkg (entryType) {
  return null;
}
function transact(transactionData) {
  var transaction = {
    timestamp: (new Date()).valueOf(),
    concept  : transactionData.concept,
    amount   : transactionData.amount,
    from     : App.Agent.Hash,
    to       : transactionData.to
  }
  var hash = commit('transaction',transaction)
  var linkHash = commit('link',{
    Links:[
      {
        Base:transactionData.to,
        Link:hash,
        Tag:'out'
      }
    ]
  })
  transaction.to_link = linkHash
  update('transaction',transaction,hash)
  //send message to peer so he can validate it
  send( transactionData.to , hash , { Callback : { Function : 'sendRes' , ID : Math.random()+'' } } )
}
function sendRes(message,id) {
  console.log('response received:')
  debug(message)
}
function receive(peer, transactionHash) {
  var transaction
  try{
    transaction = get(transactionHash)
  }catch(e){
    console.log('error fetching transaction')
    return
  }
  if (currentBalance(peer) < transaction.amount) {
    return 'failed transaction'
  }
  if (transaction.from_link) {
    return 'transaction already validated'
  }
  var linkHash = commit('link',{
    Links:[
      {
        Link:transactionHash,
        Base:peer,
        Tag:'verified'
      }
    ]
  })
  transaction.from_link = linkHash  
  update('transaction',transaction,hash)
}
function currentBalance(peerAddress) {
  if (!peerAddress) {
    peerAddress = App.Agent.Hash
  }
  var links = getLinks()
}
function getHistory(hash) {
}