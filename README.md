<h1>Bacon</h1>

<hr>
<h3>Steps for a transaction from A to B:</h3>

- A commits a Transaction T0

- A commits a Link L1 to T0 using B's address as Base

- A sends a message to B with the transaction hash

- B will fetch the transaction

- B will verify the transaction

- B will commit a link L2 to the transaction using A's address as base

- B will commit a transaction T1 with T0 + L1 + L2
<hr>
<h3>Steps for a verification:</h3>

Let's say C wants to verify A's current amount:

- C uses the getLinks functions with A's address as base.

- C defines a variable v = INITIAL_AMOUNT

- for each link L:

	- v += isValid L ? L->amount : 0

- returns v
<hr>