-- Sample actual registration data for winter retreat 2025
SELECT TOP 20
    e.Event_Title,
    ep.Event_Participant_ID,
    c.Display_Name AS Participant_Name,
    id.Invoice_Detail_ID,
    id.Product_ID,
    p.Product_Name,
    pop.Option_Title,
    id.Item_Quantity,
    pop.Option_Price AS Unit_Price,
    id.Line_Total,
    (pop.Option_Price * id.Item_Quantity) AS Expected_Total,
    ((pop.Option_Price * id.Item_Quantity) - id.Line_Total) AS Discount_Amount,
    id.Item_Note
FROM Events e
INNER JOIN Event_Participants ep ON e.Event_ID = ep.Event_ID
INNER JOIN Participants par ON ep.Participant_ID = par.Participant_ID
INNER JOIN Contacts c ON par.Contact_ID = c.Contact_ID
INNER JOIN Invoice_Detail id ON ep.Event_Participant_ID = id.Event_Participant_ID
LEFT JOIN Products p ON id.Product_ID = p.Product_ID
LEFT JOIN Product_Option_Prices pop ON id.Product_Option_Price_ID = pop.Product_Option_Price_ID
WHERE e.Project_ID = 7  -- winter retreat 2025
ORDER BY ep.Event_Participant_ID, id.Invoice_Detail_ID;
