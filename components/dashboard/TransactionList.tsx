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

            {/* Show when someone else shared with the current user */}
            {transaction.isShared && transaction.sharedBy && (
              <Badge variant="secondary" className="ml-2">
                Shared by: {transaction.sharedBy.name}
              </Badge>
            )}

            {/* Show when the current user shared with others */}
            {transaction.sharedWith && transaction.sharedWith.length > 0 && (
              <div className="shared-with">
                <Badge variant="info" className="ml-2">
                  Shared with {transaction.sharedWith.length} user
                  {transaction.sharedWith.length > 1 ? "s" : ""}
                </Badge>
                <div className="shared-users-list">
                  {transaction.sharedWith.map((user) => (
                    <div key={user.id} className="shared-user">
                      {user.name || user.email}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
