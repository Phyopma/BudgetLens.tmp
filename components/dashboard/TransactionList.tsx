import React from "react";
import { Badge } from "react-bootstrap";

const TransactionList = ({ transactions }) => {
  return (
    <div>
      {transactions.map((transaction) => (
        <div key={transaction.id} className="transaction-item">
          <div className="transaction-details">
            <span>{transaction.vendor}</span>
            <span>{transaction.amount}</span>
            <span>{transaction.date}</span>
            <span>{transaction.category}</span>
            {transaction.isShared && transaction.sharedBy && (
              <Badge variant="secondary" className="ml-2">
                Shared by: {transaction.sharedBy.name}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
