/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define([
    'N/runtime',
    'N/file',
    'SuiteScripts/Coretax/ct_modul',
],
    
    (
        runtime,
        file,
        ct_modul
    ) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {

            var myScript = runtime.getCurrentScript();

            var parameter = JSON.parse(myScript.getParameter({name: 'custscript_ct_parameters'}));

            log.debug('parameter '+typeof parameter, parameter);

            var contentXML = ct_modul.generateXMLContent(parameter.id);
            log.debug('contentXML '+typeof contentXML, contentXML);

            var fileObj = file.create({
                //To make each file unique and avoid overwriting, append date on the title
                name: 'sample.xml',
                fileType: file.Type.XMLDOC,
                contents: contentXML,
                description: 'This is a XML file.',
                encoding: file.Encoding.UTF8,
                folder: 965 //XML File
            });
        
            //Save the CSV file
            var fileId = fileObj.save();

        }

        return {execute}

    });
