/*
 * 
 * 
 * 
 * 
*/
var initialBalance = 100

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
 * @param  {string[]} sources Array of Agent hashes involved in this commit.
 * @return {boolean} true if this entry may be committed to a source chain.
 *
 * @see https://developer.holochain.org/API#validateCommit_entryType_entry_header_package_sources
 * @see https://developer.holochain.org/Validation_Functions
 */
function validateCommit (entryType, entry, header, pkg, sources) {
  switch(entryType){
    case 'link':
      return entry && entry.Links && entry.Links.length === 1 &&
        validTag(entry.Links[0].Tag)
    case 'transaction':
      var amount = entry.amount
      return amount > 0 && amount === Math.floor(amount)
  }
  return false
}
function validTag(tag) {
  switch(tag){
    case 'in':
    case 'out':
    case 'completed':
      return true
  }
  return false
}
function validateLink(entryType, hash, links, package, sources){
  if (links.length!==1) {
    return false
  }
  return true
}
function validatePut (entryType, entry, header, pkg, sources) {
  return validateCommit(entryType, entry, header, pkg, sources);
}

function validateMod () {return false}
function validateDel () {return false}
function validatePutPkg (entryType) {return null}
function validateModPkg (entryType) {return null}
function validateDelPkg (entryType) {return null}

function transact(transactionData) {
  var transaction = {
    timestamp: (new Date()).valueOf(),
    concept  : transactionData.concept,
    amount   : Math.floor(Number(transactionData.amount)),
    from     : App.Key.Hash,
    to       : transactionData.to
  }
  var T0Hash = commit('transaction',transaction)
  console.log('transaction\'s commit successful ',T0Hash)
  var L1Hash = commit('link',{
    Links:[
      {
        Base : transactionData.to,
        Link : T0Hash,
        Tag  : 'in'
      }
    ]
  })
  //send message to peer so he can validate it
  try{
    var res = send(
      transactionData.to ,
      {
        T0 : T0Hash ,
        L1 : L1Hash
      }
    )
  }catch(e){
    console.log('Error: ',e)
  }
  return '{"success":true,"message":"Transaction sent"}'
}
function sendRes(message,id) {
  console.log( 'response received:' )
  debug( message )
}

function receive(peer, transactionData) {
  debug(transactionData)
  console.log('begin receiving ----------------------------------------------------')
  console.log('receiving transaction from '+peer)
  if ( ! transactionData.T0 || ! transactionData.L1 ) {
    console.log( 'missing data in transaction from ' + peer )
    return
  }
  var transaction = get(transactionData.T0)
  if ( transaction.amount <= 0 || getCreator( transactionData.T0 ) !== peer || transaction.from !== peer || transaction.to !== App.Key.Hash ) {
    console.log('invalid transaction')
    return
  }
  var L1 = get( transactionData.L1 )
  if ( ! L1 || getCreator( transactionData.L1 ) !== peer ) {
    console.log('sent link invalid')
    return
  }
  debug(L1)
  var L2Hash = commit('link',{
    Links:[{
      Link : transactionData.T0
      Base : peer,
      Tag  : 'out',//out of my peer's account
    }]
  })
  var T1 = {
    'timestamp' : transaction.timestamp,
    'from_link' : transactionData.L1,
    'concept'   : transaction.concept,
    'to_link'   : L2Hash
    'amount'    : transaction.amount,
    'from'      : transaction.from,
    'to'        : transaction.to,
  }
  var T1Hash = commit('transaction',T1)
  //the next link is intended to make a connection between T0 and T1 so the peers who
  //want to validate the transaction can find the full record.
  var linkingLink = commit('link',{
    Links:[{
      Base : transactionData.T0,
      Tag  : 'completed',
      Link : T1Hash
    }]
  })
  debug(linkingLink)
  console.log('end of transaction----------------------------------------------------')
}
/*
 * If a transaction is valid, this function will return the associated amount
 * otherwise, it will return zero.
*/
function validTransaction(transaction,address) {
  var T1 = getLinks(transaction.Hash,'',{Load:true})[0]
  if (!T1) {
    console.log('transaction not accepted')
    return 0
  }
  switch(transaction.Tag){
    case 'in':
      if ( getCreator( transaction.Hash ) !== transaction.Entry.from  ||//creator
        transaction.Entry.timestamp !== T1.Entry.timestamp || // 
        transaction.Entry.concept !== T1.Entry.concept || // 
        transaction.Entry.amount !== T1.Entry.amount || // 
        transaction.Entry.from !== T1.Entry.from || // 
        transaction.Entry.to !== T1.Entry.to || // 
        transaction.Entry.to !== address || // current node validation
        getCreator(T1.Hash) !== address // response validation
        ) {
        return 0//invalid transaction
      }
      return transaction.Entry.amount
    case 'out':
      if ( getCreator( transaction.Hash ) !== transaction.Entry.from  ||//creator
        transaction.Entry.timestamp !== T1.Entry.timestamp || // 
        transaction.Entry.concept !== T1.Entry.concept || // 
        transaction.Entry.amount !== T1.Entry.amount || // 
        transaction.Entry.from !== T1.Entry.from || // 
        transaction.Entry.to !== T1.Entry.to || // 
        transaction.Entry.from !== address || // current node validation
        getCreator(T1.Hash) !== transaction.Entry.to // response validation
        ) {
        return 0//invalid transaction
      }
      return - transaction.Entry.amount
    default:
      return 0//
  }
}
function currentBalance(peerAddress) {
  if (!peerAddress) {
    peerAddress = App.Key.Hash
  }
  var links = getLinks( peerAddress, '' ,{ Load : true } )
  var billing = initialBalance
  for (var i = links.length - 1; i >= 0; i--) {
    billing += validTransaction(links[i],peerAddress)
  }
  return billing
}
function getHistory(hash) {
  if (!peerAddress) {
    peerAddress = App.Key.Hash
  }
  return getLinks( peerAddress, { Load : true } )
}
function getAddress(argument) {
  return App.Key.Hash
}