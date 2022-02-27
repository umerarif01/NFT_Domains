import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractAbi from "../utils/contractABI.json";
import Image from "next/image";

const Main = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [domain, setDomain] = useState("");
  const [record, setRecord] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mints, setMints] = useState([]);

  const tld = ".netro";
  const CONTRACT_ADDRESS = "0x07668F737A04Da7AEF4277D66899c50623F85A9b";
  // Implement your connectWallet method here
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      // Fancy method to request access to account.
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      // Boom! This should print out public address once we authorize Metamask.
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  };

  const mintDomain = async () => {
    // Don't run if the domain is empty
    if (!domain) {
      return;
    }
    // Alert the user if the domain is too short
    if (domain.length < 3) {
      alert("Domain must be at least 3 characters long");
      return;
    }
    // Calculate price based on length of domain (change this to match your contract)
    // 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
    const price =
      domain.length === 3 ? "0.5" : domain.length === 4 ? "0.3" : "0.1";
    console.log("Minting domain", domain, "with price", price);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let tx = await contract.register(domain, {
          value: ethers.utils.parseEther(price),
        });
        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Check if the transaction was successfully completed
        if (receipt.status === 1) {
          console.log(
            "Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          // Set the record for the domain
          tx = contract.setRecord(domain, record);
          await tx.wait();

          console.log(
            "Record set! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          setTimeout(() => {
            fetchMints();
          }, 2000);

          setRecord("");
          setDomain("");
        } else {
          alert("Transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Add this function anywhere in your component (maybe after the mint function)
  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        // You know all this
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        // Get all the domain names from our contract
        const names = await contract.getAllNames();
        console.log("names", names);

        // For each name, get the record and the address
        const mintRecords = await Promise.all(
          names.map(async (name) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner,
            };
          })
        );

        console.log("MINTS FETCHED ", mintRecords);
        setMints(mintRecords);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateDomain = async () => {
    if (!record || !domain) {
      return;
    }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        let tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

        fetchMints();
        setRecord("");
        setDomain("");
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  // This will take us into edit mode and show us the edit buttons!
  const editRecord = (name) => {
    console.log("Editing record for", name);
    setEditing(true);
    setDomain(name);
  };

  useEffect(() => {
    fetchMints();
  }, [currentAccount]);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [currentAccount]);

  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className="">
          <p className="text-center text-2xl py-4 font-semibold">
            {" "}
            Recently minted domains!
          </p>
          <div className="grid grid-cols-2 gap-4 2xl:grid-cols-3">
            {mints.map((mint) => {
              return (
                <div className=" bg-red-500 p-5 rounded-md" key={mint.id}>
                  <div className="flex space-x-2">
                    <a
                      className="link"
                      href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <p className="font-bold">
                        {" "}
                        {mint.name}
                        {tld}{" "}
                      </p>
                    </a>
                    {/* If mint.owner is currentAccount, add an "edit" button*/}
                    {mint.owner.toLowerCase() ===
                    currentAccount.toLowerCase() ? (
                      <button
                        className="edit-button"
                        onClick={() => editRecord(mint.name)}
                      >
                        <Image
                          width={20}
                          height={15}
                          className=""
                          src="https://img.icons8.com/metro/26/000000/pencil.png"
                          alt="Edit button"
                        />
                      </button>
                    ) : null}
                  </div>
                  <p> {mint.record} </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  const renderNotConnectedContainer = () => (
    <div className="flex flex-col">
      <button
        className="bg-red-500 text-white text-xl font-semibold rounded-md animate-bounce p-3"
        onClick={connectWallet}
      >
        <p>CONNECT WALLET</p>
      </button>
      <p className="text-gray-600 text-xl py-2">
        Please connect to Polygon Mumbai testnet
      </p>
    </div>
  );

  const renderInputForm = () => {
    return (
      <div>
        <p
          className="text-2xl p-3 bg-red-500 text-center rounded-sm
        mb-4"
        >
          WALLET : {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}{" "}
        </p>
        <div className="flex flex-col space-y-4">
          <div className="flex p-3 bg-gray-900 rounded-md text-2xl">
            <input
              type="text"
              className="bg-transparent outline-none text-center"
              value={domain}
              placeholder="domain"
              onChange={(e) => setDomain(e.target.value)}
            />
            <p className="text-xl font-semibold"> {tld} </p>
          </div>

          <input
            type="text"
            className="p-3 bg-gray-900 rounded-md text-xl outline-none"
            value={record}
            placeholder="Write your record here..."
            onChange={(e) => setRecord(e.target.value)}
          />

          {editing ? (
            <div>
              <button
                className="bg-red-500 px-5 py-2 font-semibold rounded-md mr-2 hover:bg-red-600"
                onClick={updateDomain}
              >
                Set record
              </button>
              <button
                className="bg-red-500 px-5 py-2 font-semibold rounded-md hover:bg-red-600"
                onClick={() => {
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div>
              {" "}
              <button
                className="bg-red-500 px-5 py-2 font-semibold rounded-md mr-2 hover:bg-red-600"
                disabled={null}
                onClick={mintDomain}
              >
                Mint
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="flex-grow justify-center items-center">
      <div className="flex flex-col justify-center items-center">
        {!currentAccount && renderNotConnectedContainer()}
        {currentAccount && renderInputForm()}
        {mints && renderMints()}
      </div>
    </main>
  );
};

export default Main;
