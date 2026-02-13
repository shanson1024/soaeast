import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';

const TopBar = ({ breadcrumb, title, searchPlaceholder = "Search...", onSearch, actions }) => {
  return (
    <div className="mb-8" data-testid="topbar">
      {/* Breadcrumb */}
      {breadcrumb && (
        <p className="label-uppercase mb-2" data-testid="breadcrumb">{breadcrumb}</p>
      )}
      
      {/* Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-serif text-3xl md:text-4xl text-crm-text-primary" data-testid="page-title">
          {title}
        </h1>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          {onSearch !== undefined && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-crm-text-muted" size={16} />
              <Input
                data-testid="search-input"
                type="text"
                placeholder={searchPlaceholder}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10 w-64 bg-white border-crm-border rounded-[10px]"
              />
            </div>
          )}
          
          {/* Action Buttons */}
          {actions}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
