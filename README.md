# UpdatePricelistEntriesFromFile

Reads a `pricelistentries.csv` and `pricelistentryprices.csv` and converts to bulk price list update.

# To Use
```npx ts-node UpdatePricelistEntriesFromFlatfile/updatePricelistEntriesFromFlateFile.ts```

# Utility Class
Intended to be expanded for general functions that can be resused across scripts.

### Logger
```
  logger.log("Important Info")
```
### GetAll
*Sometimes we have to paginate over order/shipments, these are utility functions to write them to file.  Intention it to be able to read file and do whatever iterations fit the need of script.*

Includes a required `filename` parameter and optional `responseFields`
```
utils.getAll().orders({filename: "orders.txt", responseFields: "items(orderNumber)"})
```

