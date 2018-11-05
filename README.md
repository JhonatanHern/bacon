h1 Bacon

Steps for a transaction from A to B:

- A commits a Transaction t

- A commits a Link l1 to t using B's address as Base

- A updates t with the field 'from' updated with a hash to l1 

- A sends a message to B with the transaction hash

- B will fetch the transaction

- B will commit a link to the transaction using A's address as base


Steps for a verification:

Let's say C wants to verify A's current amount:

- C uses the getLinks functions with A's address as base.

- C defines a variable v = INITIAL_AMOUNT

- for each link:

	- verify links

	- v += link->amount

- returns v