/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/record',
    'N/runtime',
    'N/file',
    'N/task',
    'N/query',
    'SuiteScripts/Coretax/ct_modul',
    'SuiteScripts/Coretax/moment'
],
    
    (
        serverWidget,
        record,
        runtime,
        file,
        task,
        query,
        ct_modul,
        moment
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        

        const onRequest = (scriptContext) => {

            var userObj = runtime.getCurrentUser();
            var user_date_format = userObj.getPreference ({name: 'DATEFORMAT'});

            var scriptObj = runtime.getCurrentScript();

            var GLOBAL_PARAM = ({
                'CUT_OFF_DATE'  : moment.utc(scriptObj.getParameter({name : 'custscript_ct_date_cut_off'})).format(user_date_format),
                'PAGE_SIZE'     : scriptObj.getParameter({name : 'custscript_ct_page_size'})
            });

            if (scriptContext.request.method === 'GET') {

                log.debug('GLOBAL_PARAM '+typeof GLOBAL_PARAM, GLOBAL_PARAM);

                var form = serverWidget.createForm({
                    title : 'Generate XML Faktur Pajak Keluaran'
                });

                form.clientScriptModulePath = 'SuiteScripts/Coretax/ct_cs_generate_xml.js';

                var pageId = parseInt(scriptContext.request.parameters.page);

                // var id_subsidiary = scriptContext.request.parameters.id_subsidiary;
                var id_customer = scriptContext.request.parameters.id_customer;

                var data_start_date = scriptContext.request.parameters.data_start_date;
                var data_end_date = scriptContext.request.parameters.data_end_date;

                // Set pageId to correct value if out of index
                if (!pageId || pageId == '' || pageId < 0){
                    pageId = 0;
                }
                else if (pageId >= pageCount){
                    pageId = pageCount - 1;
                }

                // if (!id_subsidiary || id_subsidiary == '' || id_subsidiary < 0){
                //     id_subsidiary = '';
                // }

                if (!id_customer || id_customer == '' || id_customer < 0){
                    id_customer = '';
                }

                if (!data_start_date || data_start_date == '' || data_start_date < 0){
                    data_start_date = '';
                }

                if (!data_end_date || data_end_date == '' || data_end_date < 0){
                    data_end_date = '';
                }

                var FILTER_DATA = {
                    // 'id_subsidiary'     : id_subsidiary,
                    'id_customer'       : id_customer,
                    'data_start_date'   : data_start_date,
                    'data_end_date'     : data_end_date
                }

                var invoice_data = ct_modul.getInvoiceData(GLOBAL_PARAM, FILTER_DATA);

                var pageCount = Math.ceil(invoice_data.count / GLOBAL_PARAM.PAGE_SIZE);

                var selectOptions = form.addField({
                    id : 'custpage_pageid',
                    label : 'Page Index',
                    type : serverWidget.FieldType.SELECT
                });

                for (i = 0; i < pageCount; i++) {
                    if (i == pageId) {
                        selectOptions.addSelectOption({
                            value : 'pageid_' + i,
                            text : ((i * GLOBAL_PARAM.PAGE_SIZE) + 1) + ' - ' + ((i + 1) * GLOBAL_PARAM.PAGE_SIZE),
                            isSelected : true
                        });
                    } else {
                        selectOptions.addSelectOption({
                            value : 'pageid_' + i,
                            text : ((i * GLOBAL_PARAM.PAGE_SIZE) + 1) + ' - ' + ((i + 1) * GLOBAL_PARAM.PAGE_SIZE)
                        });
                    }
                }

                // var subsidiary = form.addField({id : 'custpage_subsidiary', type : serverWidget.FieldType.SELECT, source : record.Type.SUBSIDIARY, label : 'Subsidiary'});
                // if (id_subsidiary != ''){subsidiary.defaultValue = id_subsidiary;}

                var customer = form.addField({id : 'custpage_customer_filter', type : serverWidget.FieldType.SELECT, source : record.Type.CUSTOMER,label : 'Customer'});
                if (id_customer != ''){customer.defaultValue = id_customer;}

                var start_date = form.addField({id : 'custpage_start_date', type : serverWidget.FieldType.DATE, label : 'Start Date'});
                if (data_start_date != ''){start_date.defaultValue = moment.utc(data_start_date).format(user_date_format);}

                var end_date = form.addField({id : 'custpage_end_date', type : serverWidget.FieldType.DATE, label : 'End Date'});
                if (data_end_date != ''){end_date.defaultValue = moment.utc(data_end_date).format(user_date_format);}



                form.addSubmitButton({label: 'Generate XML'});

                var sublist = form.addSublist({id : 'custpage_sublist', type : serverWidget.SublistType.LIST, label : 'Invoice Data '+parseInt(invoice_data.count)});

                sublist.addField({id: 'custpage_checkbox', type: serverWidget.FieldType.CHECKBOX, label: 'Select'});

                var linkField = sublist.addField({id: 'custpage_link', type: serverWidget.FieldType.URL, label: '#'});
                linkField.linkText = 'View';

                sublist.addField({id : 'custpage_id', label : 'Internal ID',type : serverWidget.FieldType.TEXT})
                .updateDisplayType({displayType : serverWidget.FieldDisplayType.HIDDEN});

                sublist.addField({id : 'custpage_subsidiary_data', label : 'Subsidiary', type : serverWidget.FieldType.TEXT});
                sublist.addField({id : 'custpage_invoice_number', label : 'Invoice Number', type : serverWidget.FieldType.TEXT});
                sublist.addField({id : 'custpage_invoice_date', label : 'Date', type : serverWidget.FieldType.TEXT});
                sublist.addField({id : 'custpage_customer', label : 'Customer', type : serverWidget.FieldType.TEXT});
                sublist.addField({id : 'custpage_subtotal', label : 'Subtotal', type : serverWidget.FieldType.CURRENCY});
                sublist.addField({id : 'custpage_taxtotal', label : 'Taxtotal', type : serverWidget.FieldType.CURRENCY});
                sublist.addField({id : 'custpage_total', label : 'Total', type : serverWidget.FieldType.CURRENCY});

                if (invoice_data.count > 0){

                    var addResults = ct_modul.fetchSearchResult(invoice_data, pageId);

                    var j = 0;
                    addResults.forEach(function (result) {

                        sublist.setSublistValue({id : 'custpage_id', line : j, value : result.id});
                        sublist.setSublistValue({id : 'custpage_link', line : j, value : '/app/accounting/transactions/custinvc.nl?id='+result.id});
                        sublist.linkText = 'View';

                        sublist.setSublistValue({id : 'custpage_subsidiary_data', line : j, value : result.subsidiary});
                        sublist.setSublistValue({id : 'custpage_invoice_number', line : j, value : result.tranid});
                        sublist.setSublistValue({id : 'custpage_invoice_date', line : j, value : result.trandate});
                        sublist.setSublistValue({id : 'custpage_customer', line : j, value : result.entity});
                        sublist.setSublistValue({id : 'custpage_subtotal', line : j, value : result.netamountnotax});
                        sublist.setSublistValue({id : 'custpage_taxtotal', line : j, value : result.taxtotal});
                        sublist.setSublistValue({id : 'custpage_total', line : j, value : result.total});

                        j++;
                    });

                    sublist.addMarkAllButtons();
                }

                scriptContext.response.writePage(form);

            }
            else{
                var request = scriptContext.request;
			    var count = scriptContext.request.getLineCount({group: 'custpage_sublist'});

                var data = new Array();
                var count_checkbox = 0;

                for (var i = 0; i < count; i++){

                    var checkbox = request.getSublistValue({group: 'custpage_sublist', name: 'custpage_checkbox', line: i});

                    if (checkbox == 'T'){
                        var id_transaction = request.getSublistValue({group: 'custpage_sublist', name: 'custpage_id', line: i});

                        count_checkbox++;
                        data.push(id_transaction);
                    }
                }

                log.debug('data '+typeof data, data);

                var id_record_xml = ct_modul.createRecordXML(data);
                log.debug('id_record_xml '+typeof id_record_xml, id_record_xml);

                var parameters = ({
                    'id' : id_record_xml
                });

                runGenerateXML(JSON.stringify(parameters));

                
            }
        }

        function runGenerateXML(parameter){
		
            var mySchedule = query.create({type: query.Type.SCHEDULED_SCRIPT});
            var myQueryTask = task.create({taskType: task.TaskType.QUERY});
            
            myQueryTask.filePath = 'ExportFolder/export.csv';
            myQueryTask.query = mySchedule;
            
            var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
            scriptTask.scriptId = 'customscript_ct_sch_generate_xml';
            scriptTask.params = {
                'custscript_ct_parameters': parameter,
            };
            
            myQueryTask.addInboundDependency(scriptTask);
            
            var myTaskId = myQueryTask.submit();
        }

        return {onRequest}

    });
