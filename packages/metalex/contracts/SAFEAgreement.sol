// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SAFEAgreement - MetaLEX-pattern SAFE anchoring with cross-chain XRPL link
/// @notice Stores a Simple Agreement for Future Equity on-chain with bidirectional
///         linking to an XRPL MPT equity token. Follows the MetaLEX Ricardian Tripler
///         pattern: legal document hash + on-chain parameters + cryptographic signatures.
/// @dev Deployed by the Lapis AI agent during settlement. The agent role manages
///      lifecycle transitions (link, settle, void).
contract SAFEAgreement {
    enum Status { Proposed, Confirmed, Settled, Voided }

    struct SAFETerms {
        string companyName;
        uint256 valuationCapUSD;
        uint256 discountRateBps;
        uint256 investmentAmountUSD;
        string governingLaw;
        string disputeResolution;
    }

    struct CrossChainLink {
        string xrplMptIssuanceId;
        string xrplNetwork;
        string founderXrplAddress;
    }

    // --- Immutable state ---
    address public immutable agent;
    address public immutable founder;
    bytes32 public immutable documentHash;
    uint256 public immutable createdAt;

    // --- Mutable state ---
    SAFETerms public terms;
    CrossChainLink public crossChain;
    Status public status;
    uint256 public confirmedAt;
    address[] public investors;
    mapping(address => bool) public hasConfirmed;

    // --- Events ---
    event SAFEProposed(
        address indexed founder,
        bytes32 indexed documentHash,
        string companyName,
        uint256 valuationCapUSD
    );
    event SAFEConfirmed(address indexed confirmer, uint256 timestamp);
    event XRPLLinked(string mptIssuanceId, string xrplNetwork);
    event SAFESettled(uint256 timestamp);
    event SAFEVoided(uint256 timestamp, string reason);

    // --- Modifiers ---
    modifier onlyAgent() {
        require(msg.sender == agent, "Only agent");
        _;
    }

    modifier onlyFounderOrAgent() {
        require(msg.sender == founder || msg.sender == agent, "Unauthorized");
        _;
    }

    constructor(
        address _founder,
        bytes32 _documentHash,
        SAFETerms memory _terms,
        address[] memory _investors,
        string memory _xrplNetwork,
        string memory _founderXrplAddress
    ) {
        agent = msg.sender;
        founder = _founder;
        documentHash = _documentHash;
        terms = _terms;
        investors = _investors;
        status = Status.Proposed;
        createdAt = block.timestamp;
        crossChain = CrossChainLink({
            xrplMptIssuanceId: "",
            xrplNetwork: _xrplNetwork,
            founderXrplAddress: _founderXrplAddress
        });

        emit SAFEProposed(
            _founder,
            _documentHash,
            _terms.companyName,
            _terms.valuationCapUSD
        );
    }

    /// @notice Founder or investor confirms the SAFE agreement
    function confirm() external {
        require(status == Status.Proposed || status == Status.Confirmed, "Cannot confirm");
        require(
            msg.sender == founder || _isInvestor(msg.sender),
            "Not a party"
        );
        require(!hasConfirmed[msg.sender], "Already confirmed");
        hasConfirmed[msg.sender] = true;
        emit SAFEConfirmed(msg.sender, block.timestamp);
    }

    /// @notice Agent links the XRPL MPT issuance ID (one-shot, creates bidirectional link)
    function linkXRPL(string calldata mptIssuanceId) external onlyAgent {
        require(bytes(crossChain.xrplMptIssuanceId).length == 0, "Already linked");
        require(bytes(mptIssuanceId).length > 0, "Empty MPT ID");
        crossChain.xrplMptIssuanceId = mptIssuanceId;
        status = Status.Confirmed;
        confirmedAt = block.timestamp;
        emit XRPLLinked(mptIssuanceId, crossChain.xrplNetwork);
    }

    /// @notice Agent marks the SAFE as settled (escrows created, tokens issued)
    function settle() external onlyAgent {
        require(status == Status.Confirmed, "Not confirmed");
        status = Status.Settled;
        emit SAFESettled(block.timestamp);
    }

    /// @notice Founder or agent can void the SAFE before settlement
    function voidAgreement(string calldata reason) external onlyFounderOrAgent {
        require(status != Status.Settled, "Already settled");
        status = Status.Voided;
        emit SAFEVoided(block.timestamp, reason);
    }

    // --- View functions ---

    function getInvestors() external view returns (address[] memory) {
        return investors;
    }

    function getTerms() external view returns (SAFETerms memory) {
        return terms;
    }

    function getCrossChainLink() external view returns (CrossChainLink memory) {
        return crossChain;
    }

    function getStatus() external view returns (
        Status currentStatus,
        uint256 created,
        uint256 confirmed,
        bytes32 docHash,
        string memory mptIssuanceId
    ) {
        return (
            status,
            createdAt,
            confirmedAt,
            documentHash,
            crossChain.xrplMptIssuanceId
        );
    }

    function isInvestor(address addr) external view returns (bool) {
        return _isInvestor(addr);
    }

    // --- Internal ---

    function _isInvestor(address addr) internal view returns (bool) {
        for (uint256 i = 0; i < investors.length; i++) {
            if (investors[i] == addr) return true;
        }
        return false;
    }
}
