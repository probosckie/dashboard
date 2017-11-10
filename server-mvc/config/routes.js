const home = require('../app/controllers/home');
const csvUpload = require('../app/controllers/csvUpload');
const multer = require('multer');

const login = require('../app/controllers/login');



var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './../uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fileName + '.csv')
  }
});



//const upload = multer({storage:storage});

const upload = multer({ dest: './../uploads/' });


module.exports = (app, passport) => {
    app.get('/', home.x);
    app.post('/postOrg', upload.single('data'), csvUpload.postOrg);
    app.post('/downloadTemplate', csvUpload.downloadTemplate);
    app.get('/getUserData', home.getUserData);
    app.get('/getUserHierarchyData', home.getUserHierarchyData);
    app.post('/updateUserData', home.updateUserData);
    app.get('/getEmployeeMap',home.getEmployeeMap);
    app.get('/getNestedMap',home.getNestedMap);
    app.get('/initialize/:email',home.initialize);
    app.post('/publishForm2', home.publishForm2);
    app.post('/publishFormRecurring', home.publishFormRecurring);
    app.get('/getFormStructures',home.getFormStructures);
    app.get('/getInitialData',home.getInitialData);
    app.post('/updateFormdata', home.updateFormdata);
    app.post('/updateApproval', home.updateApproval);
    app.post('/postData/:formId', upload.single('data'), csvUpload.postData);
    app.post('/publishCsvForm/:formTitle', upload.single('data'), csvUpload.publishCsvForm);
    app.post('/postCsvTemplateData/:formId/:empId', upload.single('data'), csvUpload.postCsvTemplateData);
    app.post('/setFormStructure', home.setFormStructure);
    app.post('/generateReport', home.generateReport);
    app.post('/generateReportCombineCsv', home.generateReportCombineCsv);
    app.post('/downloadTemplateIndex', home.downloadTemplateIndex);
    app.post('/downloadReport', home.downloadReport);
    app.get('/getRole/:empId', home.getRole);
    app.post('/deleteForms', home.deleteForms);
    app.get('/viewCache', home.viewCache);
    app.get('/getRecurringData', home.getRecurringData);
    app.post('/updateFormdataRecurring', home.updateFormdataRecurring);
    app.post('/postCsvTemplateDataRecurring/:publishId/:empId/:today', upload.single('data'),csvUpload.postCsvTemplateDataRecurring);
    app.get('/getRoleMap', home.getRoleMap);
    app.post('/setRole', home.setRole);
}



