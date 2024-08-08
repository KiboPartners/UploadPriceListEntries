import 'dotenv/config';
import Utility from "../utils";
import path from 'path';
import { Configuration } from "@kibocommerce/rest-sdk";
import { PriceListEntriesApi, PriceListEntry, PriceListEntryPrice } from "@kibocommerce/rest-sdk/clients/CatalogAdministration"

const utils = new Utility({
  fileDir: path.basename(__dirname),
  sdkConfig: new Configuration({
    tenantId: process.env.KIBO_TENANT,
    siteId: process.env.KIBO_SITE,
    catalog: process.env.KIBO_CATALOG,
    masterCatalog: process.env.KIBO_MASTER_CATALOG,
    sharedSecret: process.env.KIBO_SHARED_SECRET,
    clientId: process.env.KIBO_CLIENT_ID,
    pciHost: process.env.KIBO_PCI_HOST,
    authHost: process.env.KIBO_AUTH_HOST,
    apiEnv: process.env.KIBO_API_ENV
  })
})

type EntryMode = "ADD" | "UPDATE"

const configuration = utils.getSDKConfiguration();
const logger = utils.getLogger();
const pricelistClient = new PriceListEntriesApi(configuration)

const ENTRY_MODE: EntryMode = "ADD"

async function main() {
  const csv = require('csvtojson')
  const PRICELIST_ENTRY_FILE_PATH = 'UpdatePricelistEntriesFromFlatfile/csv/pricelistentries.csv'
  const PRICELIST_ENTRY_PRICES_FILE_PATH = 'UpdatePricelistEntriesFromFlatfile/csv/pricelistentryprices.csv'
  const pricelistEntries = await csv().fromFile(PRICELIST_ENTRY_FILE_PATH);
  const pricelistEntryPrices = await csv().fromFile(PRICELIST_ENTRY_PRICES_FILE_PATH);

  const pricelistEntryPricesStore = createPriceListEntryStore(pricelistEntryPrices)

  iterateWithWindow(pricelistEntries, 2000, addPriceListEntries)

  async function addPriceListEntries(entries: any) {
    const priceListEntryPayload: PriceListEntry[] = []

    entries.forEach((e: any) => {
      const pricelistEntryPrices = pricelistEntryPricesStore[e['Product Code']]

      if (pricelistEntryPrices && pricelistEntryPrices.length) {
        priceListEntryPayload.push({
          productCode: e['Product Code'],
          currencyCode: e['Currency Code'],
          startDate: convertToTimestamp(e['Start Date']),
          priceListCode: e['PriceList Code'],
          isVariation: e['Is Variation'] == "Yes" ? true : false,
          priceListEntryMode: e['PriceList Entry Mode'],
          discountsRestrictedMode: e['Discounts Restricted Mode'],
          discountsRestricted: e['Discounts Restricted'] == "Yes" ? true : false,
          discountsRestrictedStartDate: e['DiscountsRestricted StartDate'],
          discountsRestrictedEndDate: e['DiscountsRestricted EndDate'],
          msrp: e['Msrp'],
          msrpMode: e['Msrp Mode'],
          mapMode: e['Map Mode'],
          mapStartDate: e['Map StartDate'],
          mapEndDate: e['Map EndDate'],
          map: e['Map'],
          cost: e['Cost'],
          priceEntries: mapPriceListEntry(pricelistEntryPrices)
        })
      } else {
        //logger.log(`No pricelistentries for ${e['Product Code']}`)
      }
    })

    if (priceListEntryPayload.length > 0) {
      try {

        if (ENTRY_MODE == "ADD") {
          const uploadedPriceListEntries = await pricelistClient.bulkAddPriceListEntries({ allowPartialSuccess: true, priceListEntry: priceListEntryPayload })
          logger.log(`Added pricelist entries.`)
        }

        if (ENTRY_MODE == "UPDATE") {
          const uploadedPriceListEntries = await pricelistClient.bulkUpdatePriceListEntries({ allowPartialSuccess: true, priceListEntry: priceListEntryPayload })
          logger.log(`Updated pricelist entries.`)
        }

      } catch (e: any) {
        logger.log(JSON.stringify(e.apiError))
      }
    } else {
      logger.error(`No updates to be made`)
    }
  }
}

main();

/**
 *
 *
 * HELPERS
 *
 *
 */

function mapPriceListEntry(entries: any[]): PriceListEntryPrice[] {
  return entries.map((e: any) => {
    return {
      minQty: e['Minimum Quantity'],
      listPriceMode: e['ListPrice Mode'],
      listPrice: e['ListPrice'],
      salePriceMode: e['SalePriceMode'],
      salePrice: e['SalePrice'],
      subscriptionPriceMode: e['SubscriptionPriceMode'],
      subscriptionPrice: e['SubscriptionPrice'],
      subscriptionSalePriceMode: e['SubscriptionSalePriceMode'],
      subscriptionSalePrice: e['SubscriptionSalePrice']
    }
  })
}

function createPriceListEntryStore(priceListEntries: any) {
  const store: any = {}

  priceListEntries.forEach((e: any) => {
    const key = e['Product Code']

    if (!store[key]) {
      store[key] = []
    }
    store[key].push(e)

  })

  return store

}

async function iterateWithWindow(arr: any[], windowSize: number, uploadPricelistFunc: any) {
  const actualWindowSize = Math.min(windowSize, arr.length);


  for (let i = 0; i <= arr.length; i += actualWindowSize) {
    const endIndex = i + actualWindowSize;
    const subsection = arr.slice(i, endIndex);
    await uploadPricelistFunc(subsection);
  }
}

function convertToTimestamp(dateString: string): string {
  const date = new Date(dateString);

  const year = date.getUTCFullYear()
  const month = ("0" + (date.getUTCMonth() + 1)).slice(-2)
  const day = ("0" + date.getUTCDate()).slice(-2)
  const hours = ("0" + date.getUTCHours()).slice(-2)
  const minutes = ("0" + date.getUTCMinutes()).slice(-2)
  const seconds = ("0" + date.getUTCSeconds()).slice(-2)
  const milliseconds = ("000" + date.getUTCMilliseconds()).slice(-3)

  let isoDateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;

  return isoDateString;
}
