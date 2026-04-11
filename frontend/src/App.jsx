import { useState } from "react";
import GeneralInfo from "./components/GeneralInfo";
import InspectionSummaryTable from "./components/InspectionSummaryTable";
import RemarksStep from "./components/RemarksStep";
import QuantityDetails from "./components/QuantityDetails";
import ConclusionStep from "./components/ConclusionStep";
import WorkmanshipDefects from "./components/WorkmanshipDefects";
import OnSiteTests from "./components/OnSiteTests";
import FinalDetails from "./components/FinalDetails";
import { buttonStyle } from "./styles";

function App() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({});
  const [items, setItems] = useState([{ name: "", orderQty: "", availableQty: "" }]);

  const handleChange = (e) => {
    console.log("handleChange fired:", e.target.name, "=", e.target.value);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", orderQty: "", availableQty: "" }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    setForm({ ...form, images: e.target.files });
  };

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);

  const submit = async () => {
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (key === "images") {
        for (let i = 0; i < form.images.length; i++) {
          formData.append("images", form.images[i]);
        }
      } else {
        formData.append(key, form[key]);
      }
    });

    // Add items as JSON
    formData.append("items", JSON.stringify(items));

    const res = await fetch("http://localhost:5000/generate", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "report.docx";
    a.click();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "white",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1000px",
        background: "#1e293b",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 0 20px rgba(0,0,0,0.5)",
        marginTop: "20px"
      }}>

        <h2 style={{ textAlign: "center" }}>Inspection Report</h2>
        <p style={{ textAlign: "center", opacity: 0.7 }}>
          Step {step} of 8
        </p>

        {step === 1 && <GeneralInfo form={form} handleChange={handleChange} onNext={next} />}

        {step === 2 && (
          <InspectionSummaryTable 
            form={form}
            handleChange={handleChange}
            onPrev={prev} 
            onNext={next} 
          />
        )}

        {step === 3 && (
          <RemarksStep 
            form={form}
            handleChange={handleChange}
            onPrev={prev} 
            onNext={next} 
          />
        )}

        {step === 4 && (
          <ConclusionStep 
            form={form}
            handleChange={handleChange}
            onPrev={prev} 
            onNext={next} 
          />
        )}

        {step === 5 && (
          <QuantityDetails 
            items={items} 
            onItemChange={handleItemChange} 
            onAddItem={addItem} 
            onRemoveItem={removeItem}
            form={form}
            handleChange={handleChange}
            onPrev={prev} 
            onNext={next} 
          />
        )}

        {step === 6 && (
          <WorkmanshipDefects 
            form={form}
            handleChange={handleChange}
            onPrev={prev} 
            onNext={next} 
          />
        )}

        {step === 7 && (
          <OnSiteTests 
            form={form}
            handleChange={handleChange}
            onPrev={prev} 
            onNext={next} 
          />
        )}

        {step === 8 && (
          <FinalDetails 
            form={form} 
            handleChange={handleChange} 
            onFileChange={handleFileChange}
            onPrev={prev} 
            onSubmit={submit} 
          />
        )}
        
      </div>
    </div>
  );
}

export default App;