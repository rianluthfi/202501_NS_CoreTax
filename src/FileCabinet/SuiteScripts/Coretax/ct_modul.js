/**
 * @NApiVersion 2.1
 */
define([
    'N/search',
    'N/record',
    'SuiteScripts/Coretax/moment'
],
    
    (
        search,
        record,
        moment
    ) => {

        const getInvoiceData = (GLOBAL_PARAM, FILTER_DATA) => {

            var customFilter = new Array();

            customFilter.push(["type","anyof","CustInvc"]);
            customFilter.push("AND");
            customFilter.push(["mainline","is","T"]);
            customFilter.push("AND");
            customFilter.push(["subsidiary","anyof","3"]); // Subsidiary ACA INDONESIA ONLY

            // if (FILTER_DATA.id_subsidiary){
            //     customFilter.push("AND");
            //     customFilter.push(["subsidiary","anyof",FILTER_DATA.id_subsidiary]);
            // }

            if (FILTER_DATA.id_customer){
                customFilter.push("AND");
                customFilter.push(["name","anyof",FILTER_DATA.id_customer]);
            }

            if (GLOBAL_PARAM.CUT_OFF_DATE){
                customFilter.push("AND");
                customFilter.push(["trandate","onorafter",GLOBAL_PARAM.CUT_OFF_DATE]);
            }

            if (FILTER_DATA.data_start_date && FILTER_DATA.data_end_date){
                customFilter.push("AND");
                customFilter.push(["trandate","within",FILTER_DATA.data_start_date,FILTER_DATA.data_end_date]);
            }

            if (FILTER_DATA.data_start_date && !FILTER_DATA.data_end_date){
                customFilter.push("AND");
                customFilter.push(["trandate","onorafter",FILTER_DATA.data_start_date]);
            }

            if (!FILTER_DATA.data_start_date && FILTER_DATA.data_end_date){
                customFilter.push("AND");
                customFilter.push(["trandate","onorbefore",FILTER_DATA.data_end_date]);
            }

            var searchData = search.create({
                type: "invoice",
                filters: customFilter,
                columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({
                            name: "trandate",
                            sort: search.Sort.ASC,
                            label: "Date"
                        }),
                        search.createColumn({
                            name: "tranid",
                            sort: search.Sort.ASC,
                            label: "Document Number"
                        }),
                        search.createColumn({name: "entity", label: "Name"}),
                        search.createColumn({name: "subsidiary", label: "Subsidiary"}),
                        search.createColumn({name: "department", label: "Department"}),
                        search.createColumn({name: "class", label: "Class"}),
                        search.createColumn({name: "location", label: "Location"}),
                        // search.createColumn({name: "cseg1", label: "ACA Project"}),
                        search.createColumn({name: "memomain", label: "Memo (Main)"}),
                        search.createColumn({name: "netamountnotax", label: "Amount (Net of Tax)"}),
                        search.createColumn({name: "taxtotal", label: "Amount (Transaction Tax Total)"}),
                        search.createColumn({name: "total", label: "Amount (Transaction Total)"})
                    ],
                settings: 
                    [
                        search.createSetting({
                            name: 'consolidationtype',
                            value: 'NONE'
                        })
                    ]
            });
   
            return searchData.runPaged({
               pageSize : GLOBAL_PARAM.PAGE_SIZE
            });
        }

        const fetchSearchResult = (pagedData, pageIndex) => {

            var searchPage = pagedData.fetch({
                index : pageIndex
            });

            var results = new Array();

            searchPage.data.forEach(function (result) {

                // log.debug('result fetchSearchResult '+typeof result, result);
                
                var internalId = result.id;
                
                var trandate = result.getValue({name : 'trandate'});
                var tranid = result.getValue({name : 'tranid'});
                var entity = result.getText({name : 'entity'});
                var subsidiary = result.getText({name : 'subsidiary'});
                var netamountnotax = result.getValue({name : 'netamountnotax'});
                var taxtotal = result.getValue({name : 'taxtotal'});
                var total = result.getValue({name : 'total'});

                results.push({
                    'id'              : internalId,
                    'trandate'        : trandate,
                    'tranid'          : tranid,
                    'entity'          : entity,
                    'subsidiary'      : subsidiary,
                    'netamountnotax'  : netamountnotax,
                    'taxtotal'        : taxtotal,
                    'total'           : total
                });
            });

            return results;
        }

        const createRecordXML = (data_invoices) => {
		
            var customRecord = record.create({
               type: 'customrecord_ct_generate_xml',
               isDynamic: true
            });
            
            customRecord.setValue('custrecord_ct_list_of_invoice', data_invoices);
            
            customRecord.save();
            
            return customRecord.id;
            
        }

        const getRecordXMLbyID = (ID) => {

            var data = new Object();

            var customrecord_ct_generate_xmlSearchObj = search.create({
                type: "customrecord_ct_generate_xml",
                filters:
                [
                   ["internalid","anyof",ID]
                ],
                columns:
                [
                   search.createColumn({name: "id", label: "ID"}),
                   search.createColumn({name: "custrecord_ct_list_of_invoice", label: "CT List of Invoice"}),
                   search.createColumn({name: "custrecord_ct_status", label: "CT Status"}),
                   search.createColumn({name: "custrecord_ct_link_xml_file", label: "CT Link XML File"}),
                   search.createColumn({name: "custrecord_ct_description", label: "CT Description"})
                ]
            });
            var searchResultCount = customrecord_ct_generate_xmlSearchObj.runPaged().count;
            log.debug("customrecord_ct_generate_xmlSearchObj result count",searchResultCount);
            customrecord_ct_generate_xmlSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results

                data = {
                    'id' : result.getValue('ID'),
                    'id_invoices' : JSON.stringify(result.getValue('custrecord_ct_list_of_invoice').split(","))
                }

                return false;
            });

            return data;
        }

        const getCoreTaxInvoiceHeaderbyID = (ID_invoice) => {

            var data = new Object();

            var invoiceSearchObj = search.create({
                type: "invoice",
                settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                filters:
                [
                    ["mainline","is","T"], 
                    "AND", 
                    ["type","anyof","CustInvc"], 
                    "AND", 
                    ["subsidiary","anyof","3"],
                    "AND", 
                    ["internalid","anyof",ID_invoice]
                ],
                columns:
                [
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({name: "trandate", label: "Date"}),
                    search.createColumn({name: "tranid", label: "Document Number"}),
                    search.createColumn({name: "entity", label: "Name"})
                ]
            });
            var searchResultCount = invoiceSearchObj.runPaged().count;
            log.debug("invoiceSearchObj result count",searchResultCount);
            invoiceSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                data = {
                    'id' : result.getValue('internalid'),
                    'trandate' : moment.utc(result.getValue('trandate')).format('YYYY-MM-DD'),
                    'tranid' : result.getValue('tranid'),
                    'entity' : result.getValue('entity')
                }
                return false;
            });

            return data;
        }

        const getDataCustomerbyID = (ID_customer) => {

            var data = new Object();

            var customerSearchObj = search.create({
                type: "customer",
                filters:
                [
                    ["internalid","anyof",ID_customer]
                ],
                columns:
                [
                    search.createColumn({name: "entityid", label: "Name"}),
                    search.createColumn({name: "custentity_fp_lt_npwp", label: "FP LT NPWP"}),
                    search.createColumn({name: "custentity_fp_lt_nama", label: "FP LT Nama"}),
                    search.createColumn({name: "custentity_fp_lt_kode_transaksi", label: "FP LT Kode Transaksi"}),
                    search.createColumn({name: "custentity_fp_lt_keterangan_kode", label: "FP LT Keterangan Kode Transaksi"}),
                    search.createColumn({name: "custentity_fp_lt_jalan", label: "FP LT Jalan"}),
                    search.createColumn({name: "custentity_fp_lt_blok", label: "FP LT Blok"}),
                    search.createColumn({name: "custentity_fp_lt_nomor", label: "FP LT Nomor"}),
                    search.createColumn({name: "custentity_fp_lt_rt", label: "FP LT RT"}),
                    search.createColumn({name: "custentity_fp_lt_rw", label: "FP LT RW"}),
                    search.createColumn({name: "custentity_fp_lt_kelurahan", label: "FP LT Kelurahan"}),
                    search.createColumn({name: "custentity_fp_lt_kecamatan", label: "FP LT Kecamatan"}),
                    search.createColumn({name: "custentity_fp_lt_kabupaten", label: "FP LT Kabupaten"}),
                    search.createColumn({name: "custentity_fp_lt_propinsi", label: "FP LT Propinsi"}),
                    search.createColumn({name: "custentity_fp_lt_kode_pos", label: "FP LT Kode Pos"}),
                    search.createColumn({name: "custentity_fp_lt_nomor_telepon", label: "FP LT Nomor Telepon"})
                ]
            });
            var searchResultCount = customerSearchObj.runPaged().count;
            log.debug("customerSearchObj result count",searchResultCount);
            customerSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results

                var npwp = result.getValue('custentity_fp_lt_npwp');

                var jalan = result.getValue('custentity_fp_lt_jalan');
                var blok = result.getValue('custentity_fp_lt_blok');
                var nomor = result.getValue('custentity_fp_lt_nomor');
                var rt = result.getValue('custentity_fp_lt_rt');
                var rw = result.getValue('custentity_fp_lt_rw');
                var kelurahan = result.getValue('custentity_fp_lt_kelurahan');
                var kecamatan = result.getValue('custentity_fp_lt_kecamatan');
                var kabupaten = result.getValue('custentity_fp_lt_kabupaten');
                var propinsi = result.getValue('custentity_fp_lt_propinsi');
                var kode_pos = result.getValue('custentity_fp_lt_kode_pos');

                var buyer_adress =  jalan + 
                                    ' Blok '+blok+ 
                                    ' No.'+nomor+
                                    ' RT:'+rt+
                                    ' RW:'+rw+
                                    ' Kel.'+kelurahan+
                                    ' Kec.'+kecamatan+
                                    ' Kota/Kab.'+kabupaten+
                                    ' '+propinsi+
                                    ' '+kode_pos;

                data = ({
                    'id'                : result.getValue('entityid'),
                    'buyer_tin'         : npwp,
                    'buyer_document'    : 'TIN',
                    'buyer_country'     : 'IDN',
                    'buyer_name'        : result.getValue('custentity_fp_lt_nama'),
                    'buyer_adress'      : buyer_adress
                });

                return false;
            });

            return data;
        }

        const generateXMLContent = (ID_record_xml) => {

            var contents = "";

            contents = contentOpening(contents);

            contents = contentTaxInvoice(contents, ID_record_xml);

            contents = contentClosing(contents);

            return contents;
        }

        const contentOpening = (contents) => {
            contents += '<?xml version="1.0" encoding="utf-8"?>';
            contents += '\n<TaxInvoiceBulk xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">';
            contents += '\n<TIN>0030404859011000</TIN>';
            contents += '\n<ListOfTaxInvoice>';
            contents += '\n<TaxInvoice>';

            return contents;
        }

        const contentClosing = (contents) => {
            contents += '\n</TaxInvoice>';
            contents += '\n</ListOfTaxInvoice>';
            contents += '\n</TaxInvoiceBulk>';

            return contents;
        }

        const contentTaxInvoice = (contents, ID_record_xml) => {
            
            var data_record_xml = getRecordXMLbyID(ID_record_xml);

            log.debug('data_record_xml '+typeof data_record_xml, data_record_xml);

            var id_invoices = JSON.parse(data_record_xml.id_invoices);

            log.debug('id_invoices '+typeof id_invoices, id_invoices);

            log.debug('id_invoices.length '+typeof id_invoices.length, id_invoices.length);

            for (var i = 0; i < id_invoices.length; i++){
                // log.debug(id_invoices[i]);

                var invoiceHeader = getCoreTaxInvoiceHeaderbyID(id_invoices[i]);
                log.debug('invoiceHeader '+typeof invoiceHeader, invoiceHeader);

                var dataCustomer = getDataCustomerbyID(invoiceHeader.entity);
                log.debug('dataCustomer '+typeof dataCustomer, dataCustomer);
            }

            return contents;

            /**
                <TaxInvoiceDate>2025-01-21</TaxInvoiceDate>
                <TaxInvoiceOpt>Normal</TaxInvoiceOpt>
                <TrxCode>04</TrxCode>
                <AddInfo />
                <CustomDoc />
                <RefDesc>INV/2025/ID/00022</RefDesc>
                <FacilityStamp />
                <SellerIDTKU>0030404859011000000000</SellerIDTKU>
                <BuyerTin>0027518976062000</BuyerTin>
                <BuyerDocument>TIN</BuyerDocument>
                <BuyerCountry>IDN</BuyerCountry>
                <BuyerDocumentNumber>-</BuyerDocumentNumber>
                <BuyerName>-</BuyerName>
                <BuyerAdress>GEDUNG THE EAST LT.17 JL. DR. IDE ANAK AGUNG GDE AGUNG KAV.E.3.2 Blok - No.01
                    RT:000 RW:000 Kel.KUNINGAN TIMUR Kec.SETIABUDI Kota/Kab.JAKARTA SELATAN DKI JAKARTA RAYA
                    12950</BuyerAdress>
                <BuyerEmail />
                <BuyerIDTKU>0027518976062000000000</BuyerIDTKU>
             */
        }

        return {
            getInvoiceData,
            fetchSearchResult,
            createRecordXML,
            getRecordXMLbyID,
            generateXMLContent
        }

    });
