

import { authenticate } from "../shopify.server";
export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};


import React, { useState, useEffect, useCallback } from "react";
import {
  Page,
  ButtonGroup,
  Button,
  Select,
  Modal,
  TextField,
  Checkbox,
  BlockStack,
  Toast,
} from "@shopify/polaris";

export default function PriceMatchRequests() {
  // const [requests, setRequests] = useState([]);
  // const [filteredRequests, setFilteredRequests] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState("");
  // const [statusFilter, setStatusFilter] = useState("");
  // const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'

  // useEffect(() => {
  //   async function fetchRequests() {
  //     try {
  //       const response = await fetch("/api/price-match-requests");
  //       const data = await response.json();

  //       if (data.success) {
  //         setRequests(data.requests);
  //         setFilteredRequests(data.requests);
  //       } else {
  //         setError("Failed to fetch price match requests.");
  //       }
  //     } catch (err) {
  //       setError("Error fetching data.");
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   fetchRequests();
  // }, []);

  // // Handle status filter
  // const handleStatusFilterChange = (value) => {
  //   setStatusFilter(value);

  //   const filtered = requests.filter((req) =>
  //     value ? req.status === value : true,
  //   );
  //   setFilteredRequests(sortRequests(filtered, sortOrder));
  // };

  // // Handle sorting
  // const handleSortOrderChange = (order) => {
  //   setSortOrder(order);
  //   setFilteredRequests(sortRequests(filteredRequests, order));
  // };

  // const sortRequests = (data, order) => {
  //   return [...data].sort((a, b) => {
  //     const dateA = new Date(a.createdAt);
  //     const dateB = new Date(b.createdAt);
  //     return order === "asc" ? dateA - dateB : dateB - dateA;
  //   });
  // };

  // return (
  //   <Page title="Price Match Requests" fullWidth>
  //     <div className="table-container">
  //       <div className="filters-container">
  //         <Select
  //           options={[
  //             { label: "Filter by Status", value: "" },
  //             { label: "Approved", value: "approved" },
  //             { label: "Pending", value: "pending" },
  //           ]}
  //           onChange={handleStatusFilterChange}
  //           value={statusFilter}
  //         />
  //         <ButtonGroup segmented>
  //           <Button
  //             pressed={sortOrder === "asc"}
  //             onClick={() => handleSortOrderChange("asc")}
  //           >
  //             Oldest First
  //           </Button>
  //           <Button
  //             pressed={sortOrder === "desc"}
  //             onClick={() => handleSortOrderChange("desc")}
  //           >
  //             Newest First
  //           </Button>
  //         </ButtonGroup>
  //       </div>

  //       {loading && <p>Loading...</p>}
  //       {error && <p className="error">{error}</p>}

  //       {!loading && !error && (
  //         <table className="styled-table">
  //           <thead>
  //             <tr>
  //               <th>Customer Email</th>
  //               <th>Product ID</th>
  //               <th>Competitor Price</th>
  //               <th>Competitor URL</th>
  //               <th>Our Price</th>
  //               <th>Status</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             {filteredRequests.map((req) => (
  //               <tr key={req.id}>
  //                 <td>{req.customerEmail}</td>
  //                 <td>{req.productId}</td>
  //                 <td>£{req.competitorPrice.toFixed(2)}</td>
  //                 <td>{req.competitorUrl}</td>
  //                 <td>£{req.ourPrice.toFixed(2)}</td>
  //                 <td className={`status-${req.status}`}>{req.status}</td>
  //               </tr>
  //             ))}
  //           </tbody>
  //         </table>
  //       )}
  //     </div>
  //   </Page>
  // );
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [offerDiscount, setOfferDiscount] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState("");
   const [isSaving, setIsSaving] = useState(false);

   // Toast states
   const [toastActive, setToastActive] = useState(false);
   const [toastMessage, setToastMessage] = useState("");
 async function fetchRequests() {
   try {
     const response = await fetch("/api/price-match-requests");
     const data = await response.json();

     if (data.success) {
       setRequests(data.requests);
       setFilteredRequests(data.requests);
     } else {
       setError("Failed to fetch price match requests.");
     }
   } catch (err) {
     setError("Error fetching data.");
     console.error(err);
   } finally {
     setLoading(false);
   }
 }

  useEffect(() => {
   
    fetchRequests();
  }, []);

  // Handle status filter
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    const filtered = requests.filter((req) =>
      value ? req.status === value : true,
    );
    setFilteredRequests(sortRequests(filtered, sortOrder));
  };

  // Handle sorting
  const handleSortOrderChange = (order) => {
    setSortOrder(order);
    setFilteredRequests(sortRequests(filteredRequests, order));
  };

  const sortRequests = (data, order) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
  };

  // Open modal with selected request details
  const handleReviewClick = (request) => {
    setSelectedRequest(request);
    setOfferDiscount(false);
    setDiscountPercentage("");
    setIsModalOpen(true);
  };

  // Close modal
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Handle Save action
  const handleSave = async () => {
    if (!selectedRequest) return;
setIsSaving(true);
    const payload = {
      requestId: selectedRequest.id,
      offerDiscount,
      discountPercentage: offerDiscount ? parseFloat(discountPercentage) : 0,
    };

    try {
      const response = await fetch("/api/approve-price-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setToastMessage("Price match request processed successfully!");
        setToastActive(true);
        setIsModalOpen(false);
        // Refresh list
        setRequests((prev) =>
          prev.map((req) =>
            req.id === selectedRequest.id
              ? { ...req, status: offerDiscount ? "approved" : "denied" }
              : req,
          ),
        ); fetchRequests();
      } else {
        setToastMessage("Failed to process request.");
        setToastActive(true);
      }
    } catch (error) {
     console.error("Error approving price match:", error);
     setToastMessage("An error occurred. Please try again.");
     setToastActive(true);
    }
  };
 const toggleToast = useCallback(() => setToastActive((active) => !active), []);

  return (
    <Page title="Price Match Requests" fullWidth>
      <div className="table-container">
        <div className="filters-container">
          <Select
            options={[
              { label: "Filter by Status", value: "" },
              { label: "Approved", value: "approved" },
              { label: "Pending", value: "pending" },
            ]}
            onChange={handleStatusFilterChange}
            value={statusFilter}
          />
          <ButtonGroup segmented>
            <Button
              pressed={sortOrder === "asc"}
              onClick={() => handleSortOrderChange("asc")}
            >
              Oldest First
            </Button>
            <Button
              pressed={sortOrder === "desc"}
              onClick={() => handleSortOrderChange("desc")}
            >
              Newest First
            </Button>
          </ButtonGroup>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <table className="styled-table">
            <thead>
              <tr>
                <th></th>
                <th>Customer Email</th>
                <th>Product ID</th>
                <th>Competitor Price</th>
                <th>Competitor URL</th>
                <th>Our Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req, index) => (
                <tr key={req.id}>
                  <td>{index+1}</td>
                  <td>{req.customerEmail}</td>
                  <td>{req.productId}</td>
                  <td>£{req.competitorPrice.toFixed(2)}</td>
                  <td>{req.competitorUrl}</td>
                  <td>£{req.ourPrice.toFixed(2)}</td>
                  <td className={`status-${req.status}`}>{req.status}</td>
                  <td>
                    {req.status === "pending" && (
                      <Button onClick={() => handleReviewClick(req)}>
                        Review
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        // <Modal
        //   open={isModalOpen}
        //   onClose={handleModalClose}
        //   title="Review Price Match Request"
        //   primaryAction={{
        //     content: "Save",
        //     onAction: handleSave,
        //   }}
        //   secondaryActions={[
        //     {
        //       content: "Cancel",
        //       onAction: handleModalClose,
        //     },
        //   ]}
        // >
        //   <Modal.Section>
        //     <p>
        //       <strong>Customer:</strong> {selectedRequest.customerEmail}
        //     </p>
        //     <p>
        //       <strong>Competitor Price:</strong> £
        //       {selectedRequest.competitorPrice.toFixed(2)}
        //     </p>
        //     <p>
        //       <strong>Our Price:</strong> £{selectedRequest.ourPrice.toFixed(2)}
        //     </p>
        //     <p>
        //       <strong>Price Difference:</strong> £
        //       {(
        //         selectedRequest.ourPrice - selectedRequest.competitorPrice
        //       ).toFixed(2)}
        //     </p>

        //     <Checkbox
        //       label="Offer Discount"
        //       checked={offerDiscount}
        //       onChange={(checked) => setOfferDiscount(checked)}
        //     />

        //     {offerDiscount && (
        //       <TextField
        //         label="Discount Percentage"
        //         type="number"
        //         value={discountPercentage}
        //         onChange={(value) => setDiscountPercentage(value)}
        //         suffix="%"
        //       />
        //     )}
        //   </Modal.Section>
        // </Modal>
        <Modal
          open={isModalOpen}
          onClose={handleModalClose}
          title="Review Price Match Request"
          primaryAction={{
            content: isSaving ? "Saving..." : "Save",
            onAction: handleSave,
            disabled: isSaving,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: handleModalClose,
            },
          ]}
        >
          <Modal.Section>
            <div style={{ paddingLeft: "15px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <strong>Customer:</strong>
                <span>{selectedRequest.customerEmail}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <strong>Competitor Price:</strong>
                <span>£{selectedRequest.competitorPrice.toFixed(2)}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <strong>Our Price:</strong>
                <span>£{selectedRequest.ourPrice.toFixed(2)}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <strong>Price Difference:</strong>
                <span>
                  £
                  {(
                    selectedRequest.ourPrice - selectedRequest.competitorPrice
                  ).toFixed(2)}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <Checkbox
                  label="Offer Discount"
                  checked={offerDiscount}
                  onChange={(checked) => setOfferDiscount(checked)}
                />

                {offerDiscount && (
                  <TextField
                    type="number"
                    value={discountPercentage}
                    onChange={(value) => setDiscountPercentage(value)}
                    suffix="%"
                    autoComplete="off"
                    style={{ maxWidth: "100px" }} // Adjust input field width
                  />
                )}
              </div>
            </div>
          </Modal.Section>
        </Modal>
      )}
      {toastActive && <Toast content={toastMessage} onDismiss={toggleToast} />}
    </Page>
  );
}
