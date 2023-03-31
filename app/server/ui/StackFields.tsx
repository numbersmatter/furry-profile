
import { FieldPath } from "firebase-admin/firestore"
import { Field } from "../db.server";
import EmailField from "./StackedFields/EmailField";
import SelectField from "./StackedFields/SelectField";
import TextAreaField from "./StackedFields/TextArea";
import TextField from "./StackedFields/TextField";





export default function StackedField(
  props:{
    field: Field,
    defaultValue: string,
    errorText? :string,
  }
) {
  const { defaultValue, errorText, field} = props;

  switch(props.field.type){
    case "shortText":
      return <TextField 
       errorText={errorText} 
       defaultValue={defaultValue}
       fieldId={field.fieldId}
       label={field.label}
       />;
    case "longText":
      return <TextAreaField
      errorText={errorText} 
      defaultValue={defaultValue}
      fieldId={field.fieldId}
      label={field.label}
      />;

    case "select":
      const options = field.options ?? []
      return <SelectField
      errorText={errorText} 
      defaultValue={defaultValue}
      fieldId={field.fieldId}
      label={field.label}
      options={options}
      />
    case "email":
      return <EmailField 
      errorText={errorText} 
      defaultValue={defaultValue}
      fieldId={field.fieldId}
      label={field.label}
      />;
     
    default:
      return <div><p>Something went wrong</p></div>

  }

}