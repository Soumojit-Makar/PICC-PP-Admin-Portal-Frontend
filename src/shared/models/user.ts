export class UserFormModel {
    "userId": string = "";
    "envId": string = "";
    "roleId": string = "";
    "firstName": string = "";
    "lastName": string = "";
    "emailId": string = "";
    "contactNumber": string = "";
    "requestDate": string = "";   // can use Date if you want
    "updateDate": string = "";
    "updateComment": string = "";
    "userType": string = "";
    "userStatus": string = "";
    "password"?: string = "";
}