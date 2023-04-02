import React from "react";

const DatasetInfo = () => {

  return (
    <div className="dataset-info-card__container">
      <strong className="dataset-info-card__title">This website uses the <a href="https://preflib.org/format">Preflib format</a></strong>
      <div className="dataset-info-card__info">
        There are 4 types of data files our raw data sets take, being SOI (strict orders - incomplete list), SOC (strict orders - complete list)
        , TOC (weak orders - Complete List) and TOI (weak orders - incomplete list)
        At the beginning of each datasets consists of metadata. The following describes the meta data at the top of the input:
        <ul className="dataset-info-card__metadata-list">
          <li><em>FILE NAME</em>: the name of the file.</li>
          <li><em>TITLE</em>: the title of the data file, for instance the year of the election represented in the data file.</li>
          <li><em>DESCRIPTION</em>: a description of the data file, providing additional information about it.</li>
          <li><em>DATA TYPE</em>: the type of the data in the data file as described <a href="#types">above</a>.</li>
          <li><em>MODIFICATION TYPE</em>: the modification type of the data file as described <a href="#modification">below</a>.</li>
          <li><em>RELATES TO</em>: the name of the data file that the current file relates to, typically the source file in case the current file has been derived from another one.</li>
          <li><em>RELATED FILES</em>: the list of all the data files related to this one, comma separated.</li>
          <li><em>PUBLICATION DATE</em>: the date at which the data file was publish in the PrefLib system for the first time.</li>
          <li><em>MODIFICATION DATE</em>: the last time the data file was modified.</li>
          <li><em>NUMBER VOTERS</em>: the number of voters who submitted an order.</li>
          <li><em>NUMBER UNIQUE ORDERS</em>: the number unique orders that have been submitted.</li>
          <li><em>NUMBER ALTERNATIVES</em>: the number of alternatives in the data file (not all of them have to appear in the preferences).</li>
          <li><em>ALTERNATIVE NAME X</em>: the name of alternative number X.</li>
      </ul>
      Not all these metadata types are needed. Specficially we only need the altnerative names and their corresponding number / order.
      Following this is the preference part of the input which we line for each unique vote order. For instance:
      <ul>
          <li><em>1, 4, 3, 2</em>: indicates that 1 is preferred to 4, that is preferred to 3, itself preferred to 2.</li>
          <li><em>1, {4, 3}, 2</em>: indicates that 1 is preferred to 4 and 3, that are both preferred to 2, but 4 and 3 are ranked at the same position.</li>
      </ul>
      Before each of these orders we first describe how many voters voted for that particular order.
      In a full example we can see an input that looks like this:
      <div className="codebox">
        <table>
            <tbody>
                <tr>
                    <td className="lineNumber"> 1 </td>
                    <td className="code-line-content"># FILE NAME: example.toc</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 2 </td>
                    <td className="code-line-content"># TITLE: Example election</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 3 </td>
                    <td className="code-line-content"># DESCRIPTION: an example election</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 4 </td>
                    <td className="code-line-content"># DATA TYPE: toc</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 5 </td>
                    <td className="code-line-content"># MODIFICATION TYPE: </td>
                </tr>
                <tr>
                    <td className="lineNumber"> 6 </td>
                    <td className="code-line-content"># RELATES TO: </td>
                </tr>
                <tr>
                    <td className="lineNumber"> 7 </td>
                    <td className="code-line-content"># RELATED FILES:</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 8 </td>
                    <td className="code-line-content"># PUBLICATION DATE: 2023-03-17</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 9 </td>
                    <td className="code-line-content"># MODIFICATION DATE: 2023-03-18</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 10 </td>
                    <td className="code-line-content"># NUMBER ALTERNATIVES: 2</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 11 </td>
                    <td className="code-line-content"># NUMBER VOTERS: 12</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 12 </td>
                    <td className="code-line-content"># NUMBER UNIQUE ORDERS: 4</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 13 </td>
                    <td className="code-line-content"># ALTERNATIVE NAME 1: alternative one</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 14 </td>
                    <td className="code-line-content"># ALTERNATIVE NAME 2: alternative two</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 15 </td>
                    <td className="code-line-content"># ALTERNATIVE NAME 3: alternative three</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 16 </td>
                    <td className="code-line-content">5: 1,2,3</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 18 </td>
                    <td className="code-line-content">3: 3,1,2</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 19 </td>
                    <td className="code-line-content">3: {2,3},1</td>
                </tr>
                <tr>
                    <td className="lineNumber"> 20 </td>
                    <td className="code-line-content">1: 1,{2,3}</td>
                </tr>
            </tbody>
        </table>
      </div>
      <div className="dataset-info-card__note"><strong>Note: </strong> Don't include the linenumbers as specified in the example above.</div>
      </div>
    </div>
  );
};

export default DatasetInfo;
