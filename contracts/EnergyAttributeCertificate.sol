// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EnergyAttributeCertificate (EAC) - Polo 3.0
 * @notice Tokenized Green Energy Certificates (Proof-of-Green) for Smart Grid Microgeneration
 * 1 EAC Token represents 1 MWh of certified renewable energy generated and verified via signed IoT meters.
 */
interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract EnergyAttributeCertificate {
    string public constant name = "Polo Energy Attribute Certificate";
    string public constant symbol = "P-EAC";

    enum EnergySource { SOLAR, WIND, HYDRO, BIOMASS }

    struct Certificate {
        uint256 id;
        address producer;
        uint256 mwhAmount;        // 18 decimals (1e18 = 1 MWh)
        uint256 generationTime;
        EnergySource source;
        string meterId;
        bytes32 meterSignatureHash;
        bool retired;            // true if redeemed/burned for carbon offset
        uint256 retiredTimestamp;
        address retiredBy;
    }

    uint256 private _tokenCounter;
    address public owner;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(uint256 => Certificate) public certificates;

    event CertificateMinted(uint256 indexed tokenId, address indexed producer, uint256 mwhAmount, EnergySource source, string meterId);
    event CertificateRetired(uint256 indexed tokenId, address indexed retiredBy, uint256 timestamp);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Mint a new EAC certificate upon cryptographic proof from certified IoT AMI meter
     */
    function mintEAC(
        address producer,
        uint256 mwhAmount,
        EnergySource source,
        string calldata meterId,
        bytes32 meterSignatureHash
    ) external onlyOwner returns (uint256) {
        require(producer != address(0), "Invalid producer address");
        require(mwhAmount > 0, "Amount must exceed 0");

        _tokenCounter++;
        uint256 newTokenId = _tokenCounter;

        _owners[newTokenId] = producer;
        _balances[producer]++;

        certificates[newTokenId] = Certificate({
            id: newTokenId,
            producer: producer,
            mwhAmount: mwhAmount,
            generationTime: block.timestamp,
            source: source,
            meterId: meterId,
            meterSignatureHash: meterSignatureHash,
            retired: false,
            retiredTimestamp: 0,
            retiredBy: address(0)
        });

        emit Transfer(address(0), producer, newTokenId);
        emit CertificateMinted(newTokenId, producer, mwhAmount, source, meterId);

        return newTokenId;
    }

    /**
     * @notice Retire (burn) the EAC to permanently claim green attribute (avoid double counting)
     */
    function retireEAC(uint256 tokenId) external {
        require(_owners[tokenId] == msg.sender, "Caller is not certificate holder");
        require(!certificates[tokenId].retired, "Certificate already retired");

        certificates[tokenId].retired = true;
        certificates[tokenId].retiredTimestamp = block.timestamp;
        certificates[tokenId].retiredBy = msg.sender;

        emit CertificateRetired(tokenId, msg.sender, block.timestamp);
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "Invalid address");
        return _balances[account];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenCounter;
    }
}
