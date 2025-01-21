import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Network,
  BookOpen,
  Target,
  FileSearch,
  ExternalLink,
} from "lucide-react";

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-gray-900 border border-gray-800 rounded-lg overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="p-4 border-b border-gray-800">{children}</div>
);

const CardContent = ({ children }) => <div className="p-4">{children}</div>;

const Collapsible = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 flex items-center justify-between text-gray-400 hover:text-gray-300 transition-colors"
      >
        <span className="text-sm">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

const BotMessage = ({ message, isLoading }) => {
  // Helper function to determine if content is JSON
  const isJSON = (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Format the message content based on different sections
  const formatContent = (content) => {
    if (typeof content === "string" && isJSON(content)) {
      content = JSON.parse(content);
    }

    return (
      <div className="whitespace-pre-wrap break-words">
        {typeof content === "string"
          ? content
          : JSON.stringify(content, null, 2)}
      </div>
    );
  };

  // Render graph analysis section
  const renderGraphAnalysis = (data) => {
    const graphData = data?.detailed_results?.graph?.graph_analysis || {};
    const summary = data?.detailed_results?.graph?.summary || "";

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-100">
              Knowledge Graph Analysis
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Nodes</div>
              <div className="text-xl font-semibold text-blue-400">
                {graphData.node_count || 0}
              </div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Relationships</div>
              <div className="text-xl font-semibold text-blue-400">
                {graphData.relationship_count || 0}
              </div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Communities</div>
              <div className="text-xl font-semibold text-blue-400">
                {graphData.communities?.length || 0}
              </div>
            </div>
          </div>
          {summary && (
            <div className="text-gray-300 text-sm mt-2">
              {formatContent(summary)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render OpenTargets analysis section
  const renderOpenTargetsAnalysis = (data) => {
    const openTargetsData = data?.detailed_results?.opentargets;
    if (!openTargetsData) return null;

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-gray-100">
              OpenTargets Analysis
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-gray-300 text-sm">
            {formatContent(openTargetsData)}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render PubMed analysis section
  const renderPubMedAnalysis = (data) => {
    const pubmedData = data?.detailed_results?.pubmed;
    if (!pubmedData?.answer) return null;

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-100">
              Literature Analysis
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-gray-300 text-sm">
            {formatContent(pubmedData.answer)}
          </div>
          {pubmedData.documents && pubmedData.documents.length > 0 && (
            <Collapsible title="Referenced Papers">
              <div className="space-y-2">
                {pubmedData.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-gray-400 bg-gray-800 p-2 rounded flex items-center justify-between"
                  >
                    <span>{doc.metadata.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">PMID: {doc.metadata.pmid}</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render final synthesis section
  const renderSynthesis = (data) => {
    if (!data?.synthesis) return null;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-gray-100">
              Final Analysis
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-gray-300 text-sm">
            {formatContent(data.synthesis)}
          </div>
        </CardContent>
      </Card>
    );
  };

  // If it's a user message, render differently
  if (message.sender === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-2xl">
          {message.text}
        </div>
      </div>
    );
  }

  // For bot messages, try to parse the content if it's a response from the expert agent
  try {
    const data =
      typeof message.text === "string"
        ? JSON.parse(message.text)
        : message.text;
    if (data.detailed_results) {
      return (
        <div className="flex justify-start mb-4">
          <div className="max-w-4xl w-full space-y-4">
            {renderGraphAnalysis(data)}
            {renderOpenTargetsAnalysis(data)}
            {renderPubMedAnalysis(data)}
            {renderSynthesis(data)}
          </div>
        </div>
      );
    }
  } catch (e) {
    // If parsing fails, render as regular message
    return (
      <div className="flex justify-start mb-4">
        <div className="bg-gray-900 text-gray-100 rounded-lg px-4 py-2 max-w-2xl border border-gray-800">
          {message.text}
        </div>
      </div>
    );
  }
};

export default BotMessage;
