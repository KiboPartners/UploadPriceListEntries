import { Configuration } from "@kibocommerce/rest-sdk";
import fs from 'fs';
import path from 'path';
import { UtilityConfig } from ".";
import { OrderApi } from '@kibocommerce/rest-sdk/clients/Commerce'
import { ShipmentApi } from '@kibocommerce/rest-sdk/clients/Fulfillment'

export interface GetAllOrdersConfig {
  filename: string,
  responseFields?: string,
}

export interface GetAllShipmentsConfig {
  filename: string
}

export interface GetOrdersParams {
  pageSize?: number,
  startIndex?: number,
  responseFields?: string
}

class GetAll {
  sdkConfig: Configuration;
  fileDir: string;
  constructor(config: Configuration, fileDir: string) {
    this.sdkConfig = config
    this.fileDir = fileDir
  }

  public test() {
    console.log('test')
  }

  public async orders(getAllOrdersConfig: GetAllOrdersConfig) {
    const orderHelper = new OrderApi(this.sdkConfig)
    const PAGE_SIZE = 200
    const orderMetaData = await orderHelper.getOrders({ pageSize: PAGE_SIZE, responseFields: "-items" })
    const { pageCount = 0 } = orderMetaData

    for (let i = 0, currentPage = 0; i < pageCount; i++) {

      const params: GetOrdersParams = {
        pageSize: PAGE_SIZE,
        startIndex: currentPage,
      }

      if (getAllOrdersConfig.responseFields) {
        params['responseFields'] = getAllOrdersConfig.responseFields
      }

      const orders = await orderHelper.getOrders(params)

      if (orders.items) {
        for (let order of orders.items) {
          await this.writeToFile(getAllOrdersConfig.filename, JSON.stringify(order))
        }
      }

      currentPage += PAGE_SIZE
    }

    console.log(`Retreived all ${orderMetaData.totalCount} orders!`)
  }

  public async shipments(getAllShipmentsConfig: GetAllShipmentsConfig) {
    const shipmentHelper = new ShipmentApi(this.sdkConfig)
    const PAGE_SIZE = 200
    const shipmentMetaData = await shipmentHelper.getShipments({ pageSize: PAGE_SIZE })
    const totalPages = shipmentMetaData.page?.totalPages || 0

    for (let i = 0, currentPage = 0; i < totalPages; i++) {
      const shipments = await shipmentHelper.getShipments({ pageSize: PAGE_SIZE, page: currentPage })
      //@ts-ignore
      if (shipments?._embedded?.shipments) {
        //@ts-ignore
        for (let shipment of shipments._embedded.shipments) {
          await this.writeToFile(getAllShipmentsConfig.filename, JSON.stringify(shipment))

        }
      }

      currentPage += 1
    }
    //@ts-ignore
    console.log(`Retreived all ${shipmentMetaData.totalElements} shipments!`)
  }

  private async writeToFile(filename: string, data: string) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.fileDir, filename);
      const dataToAppend = `${data}\n`;

      // Check if the file exists
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          // File does not exist, create it and append data
          fs.writeFile(filePath, dataToAppend, (err) => {
            if (err) {
              console.error('Error creating file:', err);
              return;
            }
            resolve('OK')

          });
        } else {
          // File exists, append data
          fs.appendFile(filePath, dataToAppend, (err) => {
            if (err) {
              console.error('Error appending to file:', err);
              return;
            }
            resolve('OK')
          });
        }
      });


    })
  }
}

export default GetAll;