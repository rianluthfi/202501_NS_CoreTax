/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define([
    'N/url', 
    'N/format'
],
function (
    url, 
    format
) {
    function fieldChanged(context) {
     
        if (
            context.fieldId == 'custpage_pageid' ||
            context.fieldId == 'custpage_subsidiary' || 
            context.fieldId == 'custpage_customer_filter' ||
            context.fieldId == 'custpage_start_date' || 
            context.fieldId == 'custpage_end_date'
        ) {
            var pageId = context.currentRecord.getValue({
                fieldId : 'custpage_pageid'
            });
         
            // var id_subsidiary = context.currentRecord.getValue({
            //     fieldId : 'custpage_subsidiary'
            // });
         
            var id_customer = context.currentRecord.getValue({
                fieldId : 'custpage_customer_filter'
            });

            var data_start_date = context.currentRecord.getText({
                fieldId : 'custpage_start_date'
            });

            var data_end_date = context.currentRecord.getText({
                fieldId : 'custpage_end_date'
            });

            pageId = parseInt(pageId.split('_')[1]);

            document.location = url.resolveScript({
                scriptId : getParameterFromURL('script'),
                deploymentId : getParameterFromURL('deploy'),
                params : {
                    'page' 				: pageId,
                    // 'id_subsidiary' 	: id_subsidiary,
                    'id_customer' 	    : id_customer,
                    'data_start_date' 	: data_start_date,
                    'data_end_date' 	: data_end_date
                }
            });
        }
    }

    function getSuiteletPage(suiteletScriptId, suiteletDeploymentId, pageId) {
        document.location = url.resolveScript({
                scriptId : suiteletScriptId,
                deploymentId : suiteletDeploymentId,
                params : {
                    'page' : pageId
                }
            });
    }

    function getParameterFromURL(param) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == param) {
                return decodeURIComponent(pair[1]);
            }
        }
        return (false);
    }
 
    function refreshPageStatus(){
        
        alert('refreshPageStatus');
        
        document.location = url.resolveScript({
            scriptId : 'customscript_sti_sl_status_released_disb',
            deploymentId : 'customdeploy_sti_sl_status_released_disb'
        });
    }

    return {
        fieldChanged : fieldChanged,
        getSuiteletPage : getSuiteletPage
    };

});